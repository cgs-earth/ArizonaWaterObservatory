# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging

from com.covjson import CoverageCollectionDict
from com.geojson.helpers import GeojsonFeatureCollectionDict, GeojsonFeatureDict
from com.helpers import EDRFieldsMapping
from com.otel import otel_trace
from pygeoapi.provider.base import ProviderQueryError
from pygeoapi.provider.base_edr import BaseEDRProvider
import s3fs
import xarray as xr

from .nationalwatermodel import (
    ProviderSchema,
)

LOGGER = logging.getLogger(__name__)


class NationalWaterModelEDRProvider(BaseEDRProvider):
    """The EDR Provider"""

    data: xr.Dataset
    fields_cache: EDRFieldsMapping = {}
    provider_def: ProviderSchema

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object

        :param provider_def: provider definition
        """
        BaseEDRProvider.__init__(self, provider_def)
        self.instances = []

        fs = s3fs.S3FileSystem(
            endpoint_url=provider_def["data"],
            anon=True,
        )
        mapper = fs.get_mapper(provider_def["dataset_path"])
        self.data = xr.open_zarr(mapper, consolidated=True, chunks="auto")
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
        for var in self.data.variables:
            edr_fields[str(var)] = {
                "title": str(var),
                "x-ogc-unit": str(var),
                "description": str(var),
                "type": "number",
            }
        self.fields_cache = edr_fields
        return edr_fields

    @otel_trace()
    def cube(
        self,
        bbox: list,
        datetime_: str | None = None,
        select_properties: list[str] | None = None,
        z: str | None = None,
        **kwargs,
    ) -> CoverageCollectionDict:
        # if datetime_ is None:
        #     raise ProviderQueryError("datetime is required")
        if select_properties is None:
            raise ProviderQueryError("select_properties is required")

        # Select requested variables
        variables_to_select = list(select_properties)
        if (self.provider_def["time_field"]) not in variables_to_select:
            variables_to_select.append(self.provider_def["time_field"])

        selected = self.data[variables_to_select]

        # Handle time selection (time is a variable, not a coordinate)
        time_var_name = self.provider_def["time_field"]  # probably "time"
        if datetime_ is not None:
            selected = selected.where(selected[time_var_name] == datetime_, drop=True)
        else:
            # Pick latest time
            latest_time_index = selected[time_var_name].size - 1
            latest_time_value = selected[time_var_name].isel(
                {time_var_name: latest_time_index}
            )
            selected = selected.where(
                selected[time_var_name] == latest_time_value, drop=True
            )

        # Geospatial filtering using latitude and longitude variables
        lon_min, lat_min, lon_max, lat_max = bbox
        selected = selected.where(
            (selected.longitude >= lon_min)
            & (selected.longitude <= lon_max)
            & (selected.latitude >= lat_min)
            & (selected.latitude <= lat_max),
            drop=True,
        )

        return selected.load()

    def area(
        self,
        wkt: str,
        select_properties: list[str],
        datetime_: str | None = None,
        z: str | None = None,
        **kwargs,
    ) -> CoverageCollectionDict:
        raise NotImplementedError

    def items(self, **kwargs):
        pass
