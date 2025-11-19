# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import TypedDict

from com.covjson import CoverageCollectionDict, CoverageDict
from com.geojson.helpers import (
    GeojsonFeatureCollectionDict,
    GeojsonFeatureDict,
)
from com.helpers import EDRFieldsMapping
from com.otel import otel_trace
from pygeoapi.crs import DEFAULT_CRS
from pygeoapi.provider.base import ProviderQueryError
from pygeoapi.provider.base_edr import BaseEDRProvider
from pygeoapi.util import transform_bbox
import pyproj
import xarray as xr

from NationalWaterModel.lib import (
    dataset_to_covjson,
    fetch_data,
)

from .lib import get_crs_from_dataset, get_zarr_dataset_handle, project_dataset
from .nationalwatermodel import (
    ProviderSchema,
)

LOGGER = logging.getLogger(__name__)


class XarrayOutputDict(TypedDict):
    coords: dict
    attrs: dict
    dims: dict
    data_vars: dict[str, dict | list]


class NationalWaterModelEDRProvider(BaseEDRProvider):
    """The EDR Provider"""

    zarr_dataset: xr.Dataset
    fields_cache: EDRFieldsMapping = {}
    provider_def: ProviderSchema
    output_crs: pyproj.CRS
    storage_crs_override: pyproj.CRS | None
    raster: bool = False

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object

        :param provider_def: provider definition
        """
        super().__init__(dict(provider_def))
        self.instances = []

        self.zarr_dataset = get_zarr_dataset_handle(
            provider_def["data"],
            provider_def["remote_dataset"]
            if "remote_dataset" in provider_def
            else None,
        )

        if "storage_crs" not in provider_def:
            self.storage_crs = get_crs_from_dataset(self.zarr_dataset)

    def get_fields(self) -> EDRFieldsMapping:
        """Get the list of all parameters (i.e. fields) that the user can filter by"""
        if not self._fields:
            for var, meta in self.zarr_dataset.variables.items():
                var = str(var)
                if var in (self.x_field, self.y_field, self.time_field):
                    continue

                if meta.attrs.get("units") is None:
                    LOGGER.warning(
                        f"Variable {var} does not have units; skipping"
                    )
                    continue

                self._fields[var] = {
                    "title": meta.attrs["long_name"].title(),
                    "x-ogc-unit": meta.attrs.get("units"),
                    "description": var,
                    "type": "number",
                }

        return self._fields

    @otel_trace()
    def locations(
        self,
        location_id: str | None = None,
        datetime_: str | None = None,
        select_properties: list[str] | None = None,
        crs: str | None = None,
        format_: str | None = None,
        limit: int = 0,
        bbox: list = [],  # noqa: B006 we ignore this since pygeoapi always passes in an empty bbox and we want this to be understood in our tests
        **kwargs,
    ) -> (
        CoverageCollectionDict
        | CoverageDict
        | GeojsonFeatureCollectionDict
        | GeojsonFeatureDict
    ):
        """
        Extract data from location
        """

        if bbox is None:
            bbox = []
        if not select_properties or len(select_properties) > 1:
            raise ProviderQueryError(
                f"Only one property at a time is supported to prevent overfetching, but got {select_properties}"
            )
        if not datetime_:
            raise ProviderQueryError(
                "datetime is required to prevent overfetching"
            )
        if bbox:
            bbox = transform_bbox(bbox, DEFAULT_CRS, self.storage_crs)

        loaded_data = fetch_data(
            unopened_dataset=self.zarr_dataset,
            timeseries_properties_to_fetch=select_properties,
            datetime_filter=datetime_,
            feature_id=location_id,
            bbox=bbox,
            feature_limit=limit,
            x_field=self.x_field,
            y_field=self.y_field,
            time_field=self.time_field,
        )

        projected_dataset = project_dataset(
            loaded_data,
            self.storage_crs,
            pyproj.CRS.from_epsg(4326),
            self.x_field,
            self.y_field,
        )

        parameter_name = select_properties[0]
        parameter_unit = self.fields[parameter_name]["x-ogc-unit"]

        return dataset_to_covjson(
            dataset=projected_dataset,
            timeseries_parameter_name=parameter_name,
            timeseries_parameter_unit=parameter_unit,
            x_axis=self.x_field,
            y_axis=self.y_field,
            time_axis=self.time_field,
            output_crs=pyproj.CRS.from_epsg(4326),
        )

    @otel_trace()
    def cube(
        self,
        bbox: list,
        datetime_: str | None = None,
        select_properties: list[str] | None = None,
        z: str | None = None,
        **kwargs,
    ):
        """
        Given a bounding box, return all the data within it

        Example: http://localhost:5005/collections/National_Water_Model_Channel_Routing_Output/cube?bbox=-112.5,31.7,-110.7,33.0&f=json&parameter-name=streamflow&datetime=2023-01-01
                 http://localhost:5005/collections/National_Water_Model_Channel_Routing_Output/cube?bbox=-112.5,31.7,-110.7,33.0&f=html&parameter-name=streamflow&datetime=2023-01-01
                 http://localhost:5005/collections/National_Water_Model_Channel_Routing_Output/cube?bbox=-112.5,31.7,-111.7,31.9&f=html&parameter-name=velocity&datetime=2023-01-01/2023-01-02
                 http://localhost:5005/collections/National_Water_Data_Reach_to_Reach_Routing_Output/cube?parameter-name=sfcheadsubrt&bbox=-112.5,31.7,-110.7,33.0&datetime=2020-01-01
                 http://localhost:5005/collections/National_Water_Data_Reach_to_Reach_Routing_Output/cube?parameter-name=sfcheadsubrt&bbox=-112.5,31.7,-111.7,32.0&datetime=2020-01-01/2020-01-02&f=json
        """
        if not select_properties or len(select_properties) > 1:
            raise ValueError(
                f"Only one property at a time is supported to prevent overfetching, but got {select_properties}"
            )
        if not datetime_:
            raise ValueError("datetime is required to prevent overfetching")

        if not bbox:
            raise ValueError("bbox is required to prevent overfetching")

        bbox = transform_bbox(bbox, DEFAULT_CRS, self.storage_crs)

        if z:
            raise NotImplementedError("Elevation filtering not implemented")

        assert self.zarr_dataset
        loaded_data = fetch_data(
            unopened_dataset=self.zarr_dataset,
            timeseries_properties_to_fetch=select_properties,
            datetime_filter=datetime_,
            bbox=bbox,
            x_field=self.x_field,
            y_field=self.y_field,
            time_field=self.time_field,
            raster=self.raster,
        )

        projected_dataset = project_dataset(
            loaded_data,
            self.storage_crs,
            pyproj.CRS.from_epsg(4326),
            self.x_field,
            self.y_field,
            self.raster,
        )

        parameter_name = select_properties[0]
        parameter_unit = self.fields[parameter_name]["x-ogc-unit"]

        return dataset_to_covjson(
            dataset=projected_dataset,
            timeseries_parameter_name=parameter_name,
            timeseries_parameter_unit=parameter_unit,
            x_axis=self.x_field,
            y_axis=self.y_field,
            output_crs=pyproj.CRS.from_epsg(4326),
            time_axis=self.time_field,
            raster=self.raster,
        )

    def area(
        self,
        wkt: str,
        select_properties: list[str],
        datetime_: str | None = None,
        z: str | None = None,
        **kwargs,
    ) -> CoverageCollectionDict:
        raise NotImplementedError(
            "Area queries not implemented yet; unclear if arbitrary wkt is possible in zarr serverside"
        )

    def items(
        self, **kwargs
    ) -> GeojsonFeatureCollectionDict | GeojsonFeatureDict:
        # This needs to be defined for pygeoapi to register items/ in the UI
        # https://github.com/geopython/pygeoapi/issues/1748
        ...


class NationalWaterModelRasterEDRProvider(NationalWaterModelEDRProvider):
    """The EDR Provider for raster datasets"""

    raster: bool = True

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object

        :param provider_def: provider definition
        """
        super().__init__(provider_def)

    def cube(self, *args, **kwargs):
        return super().cube(*args, **kwargs)
