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

        LOGGER.warning("Opening zarr dataset")
        self.zarr_dataset = get_zarr_dataset_handle(
            provider_def["data"], provider_def["dataset_path"]
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
        Example: http://localhost:5005/collections/National_Water_Model_Channel_Runoff/cube?bbox=-112.5,31.7,-110.7,33.0&f=json&parameter-name=streamflow&datetime=2023-01-01
                 http://localhost:5005/collections/National_Water_Model_Channel_Runoff/cube?bbox=-112.5,31.7,-110.7,33.0&f=html&parameter-name=streamflow&datetime=2023-01-01
        """
        if not select_properties:
            LOGGER.error(
                "select_properties is required to prevent overfetching, falling back to streamflow default"
            )

        if not select_properties or len(select_properties) > 1:
            raise ValueError(
                f"Only one property at a time is supported to prevent overfetching, but got {select_properties}"
            )
        if not datetime_:
            raise ValueError("datetime is required to prevent overfetching")

        if not bbox:
            raise ValueError("bbox is required to prevent overfetching")

        if z:
            raise NotImplementedError("Elevation filtering not implemented yet")

        assert self.zarr_dataset
        loaded_data = fetch_data(
            select_properties=select_properties,
            datetime_filter=datetime_,
            time_field=self.provider_def["time_field"],
            bbox=bbox,
            y_field=self.provider_def["y_field"],
            x_field=self.provider_def["x_field"],
            unopened_dataset=self.zarr_dataset,
        )

        return dataset_to_point_covjson(
            dataset=loaded_data,
            x_axis=self.provider_def["x_field"],
            y_axis=self.provider_def["y_field"],
            timeseries_parameter_name=select_properties[0],
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
        raise NotImplementedError
