# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import Literal

from com.geojson.helpers import (
    GeojsonFeatureCollectionDict,
    GeojsonFeatureDict,
    SortDict,
)
from com.otel import otel_trace
from com.protocols.providers import OAFProviderProtocol
from pygeoapi.provider.base import BaseProvider
from pygeoapi.util import crs_transform
import pyproj
import xarray as xr

from .lib import (
    ProviderSchema,
    dataset_to_geojson,
    fetch_data,
    get_crs_from_dataset,
    get_zarr_dataset_handle,
    project_dataset,
)

LOGGER = logging.getLogger(__name__)


class NationalWaterModelProvider(BaseProvider, OAFProviderProtocol):
    """Provider for OGC API Features"""

    zarr_dataset: xr.Dataset
    storage_crs_override: pyproj.CRS | None
    output_crs: pyproj.CRS

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object
        :param provider_def: provider definition
        """
        super().__init__(dict(provider_def))
        self.zarr_dataset = get_zarr_dataset_handle(
            provider_def["data"],
            provider_def["remote_dataset"]
            if "remote_dataset" in provider_def
            else None,
            is_gcs=provider_def.get("is_gcs", False),
        )
        if "storage_crs" not in provider_def:
            self.storage_crs = get_crs_from_dataset(self.zarr_dataset)

    @otel_trace()
    def items(  # type: ignore
        self,
        bbox: list,
        datetime_: str | None = None,
        properties: list[tuple[str, str]] | None = None,
        resulttype: Literal["hits", "results"] | None = "results",
        # select only features that contains all the `select_properties` values
        select_properties: list[str]
        | None = None,  # query this with ?properties in the actual url
        # select only features that contains all the `properties` with their corresponding values
        sortby: list[SortDict] | None = None,
        limit: int = 500,
        itemId: str
        | None = None,  # unlike edr, this is a string; we need to case to an int before filtering
        offset: int = 0,
        skip_geometry: bool | None = False,
        **kwargs,
    ) -> GeojsonFeatureCollectionDict | GeojsonFeatureDict:
        if properties is None:
            properties = []

        latestValueInDataset = "2023-01-01"
        result = fetch_data(
            bbox=bbox,
            timeseries_properties_to_fetch=[]
            if not select_properties
            else select_properties,
            datetime_filter=latestValueInDataset
            if not datetime_
            else datetime_,
            time_field=self.time_field,
            x_field=self.x_field,
            y_field=self.y_field,
            unopened_dataset=self.zarr_dataset,
            feature_id=itemId,
            feature_limit=limit,
            feature_offset=offset,
        )

        result = project_dataset(
            result,
            self.storage_crs,
            pyproj.CRS.from_epsg(4326),
            self.x_field,
            self.y_field,
            raster=False,
        )

        return dataset_to_geojson(
            result,
            self.x_field,
            self.y_field,
            itemId,
            limit,
        )

    @crs_transform
    def query(self, **kwargs):
        return self.items(**kwargs)

    @crs_transform
    def get(self, identifier, **kwargs):
        """
        query CSV id

        :param identifier: feature id

        :returns: dict of single GeoJSON feature
        """

        return self.items(itemId=identifier, bbox=[], **kwargs)

    def get_fields(self, **kwargs):
        """
        Get provider field information (names, types)

        Example response: {'field1': 'string', 'field2': 'number'}

        :returns: dict of field names and their associated JSON Schema types
        """
        return {}
