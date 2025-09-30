# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import TypedDict

from com.covjson import CoverageCollectionDict
from com.geojson.helpers import GeojsonFeatureCollectionDict, GeojsonFeatureDict
from com.helpers import EDRFieldsMapping
from com.otel import otel_trace
from pygeoapi.provider.base_edr import BaseEDRProvider
import xarray as xr

from NationalWaterModel.lib import (
    dataset_to_point_covjson,
    fetch_data,
)

from .lib import get_zarr_dataset_handle
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

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object

        :param provider_def: provider definition
        """
        super().__init__(provider_def)
        self.instances = []

        self.zarr_dataset = get_zarr_dataset_handle(
            provider_def["data"],
            provider_def["remote_dataset"]
            if "remote_dataset" in provider_def
            else None,
        )

        self.provider_def = provider_def

    @otel_trace()
    def locations(
        self,
        location_id: str | None = None,
        datetime_: str | None = None,
        select_properties: list[str] | None = None,
        crs: str | None = None,
        format_: str | None = None,
        limit: int | None = None,
        **kwargs,
    ) -> CoverageCollectionDict | GeojsonFeatureCollectionDict | GeojsonFeatureDict:
        """
        Extract data from location
        """
        raise NotImplementedError("Locations cannot be queried from a raster dataset")

    def get_fields(self) -> EDRFieldsMapping:
        """Get the list of all parameters (i.e. fields) that the user can filter by"""
        if self.fields_cache:
            return self.fields_cache

        edr_fields: EDRFieldsMapping = {}
        for var in self.zarr_dataset.variables:
            if var in (
                self.provider_def["x_field"],
                self.provider_def["y_field"],
                self.provider_def["time_field"],
            ):
                continue

            edr_fields[str(var)] = {
                "title": str(var),
                "x-ogc-unit": str(var),
                "description": str(var),
                "type": "number",
            }
        self.fields_cache = edr_fields
        return edr_fields

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
        """
        if not select_properties or len(select_properties) > 1:
            raise ValueError(
                f"Only one property at a time is supported to prevent overfetching, but got {select_properties}"
            )
        if not datetime_:
            raise ValueError("datetime is required to prevent overfetching")

        if not bbox:
            raise ValueError("bbox is required to prevent overfetching")

        if z:
            raise NotImplementedError("Elevation filtering not implemented")

        assert self.zarr_dataset
        loaded_data = fetch_data(
            unopened_dataset=self.zarr_dataset,
            timeseries_properties_to_fetch=select_properties,
            datetime_filter=datetime_,
            bbox=bbox,
            x_field=self.provider_def["x_field"],
            y_field=self.provider_def["y_field"],
            time_field=self.provider_def["time_field"],
        )

        return dataset_to_point_covjson(
            dataset=loaded_data,
            timeseries_parameter_name=select_properties[0],
            x_axis=self.provider_def["x_field"],
            y_axis=self.provider_def["y_field"],
            time_axis=self.provider_def["time_field"],
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

    def items(self, **kwargs):
        # This needs to be defined for pygeoapi to register items/ in the UI
        # https://github.com/geopython/pygeoapi/issues/1748
        pass
