# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import TypedDict

from com.covjson import CoverageCollectionDict
from com.geojson.helpers import GeojsonFeatureCollectionDict, GeojsonFeatureDict
from com.helpers import EDRFieldsMapping
from com.otel import otel_trace
import numpy as np
from pygeoapi.provider.base import ProviderQueryError
from pygeoapi.provider.base_edr import BaseEDRProvider
import s3fs
import xarray as xr

from .nationalwatermodel import (
    NationalWaterModelProvider,
    ProviderSchema,
)

LOGGER = logging.getLogger(__name__)


class XarrayOutputDict(TypedDict):
    coords: dict
    attrs: dict
    dims: dict
    data_vars: dict[str, dict | list]


class NationalWaterModelEDRProvider(BaseEDRProvider, NationalWaterModelProvider):
    """The EDR Provider"""

    data: xr.Dataset
    fields_cache: EDRFieldsMapping = {}
    provider_def: ProviderSchema

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object

        :param provider_def: provider definition
        """
        super().__init__(provider_def)
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

    def cube(
        self,
        bbox: list,
        datetime_: str | None = None,
        select_properties: list[str] | None = None,
        z: str | None = None,
        **kwargs,
    ):
        if select_properties is None:
            raise ProviderQueryError("select_properties is required")

        # Select requested variables
        variables_to_select = list(select_properties)
        if (self.provider_def["time_field"]) not in variables_to_select:
            variables_to_select.append(self.provider_def["time_field"])

        # Add latitude/longitude if not already included
        for coord in ["latitude", "longitude"]:
            if coord not in variables_to_select:
                variables_to_select.append(coord)

        selected = self.data[variables_to_select]

        # Handle time selection
        time_var_name = self.provider_def["time_field"]

        if datetime_ is not None:
            datetime_range = datetime_.split("/")
            available_times = selected[time_var_name].values

            if len(datetime_range) == 1:
                # Single date
                datetime_np = np.datetime64(datetime_)
                if datetime_np in available_times:
                    selected = selected.sel(time=datetime_np, drop=False)
                else:
                    # No data for this date
                    selected = selected.isel(time=0).isel(feature_id=slice(0, 0))
                    print(
                        f"Warning: {datetime_} not in available times, returning empty selection."
                    )

            elif len(datetime_range) == 2:
                # Date range
                start, stop = datetime_range

                # Resolve open-ended ranges
                start = np.datetime64(start) if start != ".." else available_times.min()
                stop = np.datetime64(stop) if stop != ".." else available_times.max()

                # Clip start/stop to available range
                start = max(start, available_times.min())
                stop = min(stop, available_times.max())

                # Select only times that exist in the dataset
                mask = (available_times >= start) & (available_times <= stop)
                if not mask.any():
                    # No data in requested range
                    selected = selected.isel(time=0).isel(feature_id=slice(0, 0))
                    print(f"Warning: No data available between {start} and {stop}.")
                else:
                    times_to_select = available_times[mask]
                    selected = selected.sel(time=times_to_select, drop=False)
        else:
            # Pick latest time index
            latest_time_index = selected[time_var_name].size - 1
            selected = selected.isel({time_var_name: latest_time_index})

        # Geospatial filtering using latitude and longitude variables
        lon_min, lat_min, lon_max, lat_max = bbox

        # latitude/longitude are 1D coords along "feature_id"
        lon = selected.longitude.compute()
        lat = selected.latitude.compute()

        mask = (lon >= lon_min) & (lon <= lon_max) & (lat >= lat_min) & (lat <= lat_max)

        # Use isel instead of where (avoids Dask boolean indexing issue)
        selected = selected.isel(feature_id=mask)

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
