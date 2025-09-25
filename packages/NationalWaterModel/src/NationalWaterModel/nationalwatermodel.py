# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import Literal, TypedDict

from com.geojson.helpers import (
    GeojsonFeatureCollectionDict,
    GeojsonFeatureDict,
    SortDict,
)
from com.protocols.providers import OAFProviderProtocol
from pygeoapi.provider.base import BaseProvider
from pygeoapi.util import crs_transform

from .lib import fetch_data, get_zarr_dataset_handle

LOGGER = logging.getLogger(__name__)


class ProviderSchema(TypedDict):
    type: Literal["feature", "edr"]
    data: str
    name: str
    dataset_path: str
    time_field: str
    x_field: str
    y_field: str


class NationalWaterModelProvider(BaseProvider, OAFProviderProtocol):
    """Provider for OGC API Features"""

    def __init__(self, provider_def: ProviderSchema):
        """
        Initialize object
        :param provider_def: provider definition
        """
        super().__init__(provider_def)
        self.provider_def = provider_def

    def items(
        self,
        properties: list[tuple[str, str]],
        bbox: list,
        datetime_: str | None = None,
        resulttype: Literal["hits", "results"] | None = "results",
        # select only features that contains all the `select_properties` values
        select_properties: list[str]
        | None = None,  # query this with ?properties in the actual url
        # select only features that contains all the `properties` with their corresponding values
        sortby: list[SortDict] | None = None,
        limit: int | None = None,
        itemId: str
        | None = None,  # unlike edr, this is a string; we need to case to an int before filtering
        offset: int | None = 0,
        skip_geometry: bool | None = False,
        **kwargs,
    ) -> GeojsonFeatureCollectionDict | GeojsonFeatureDict:
        latestTime = "2020-01-01"
        bbox_arizona = [-115, 31, -109, 37]
        result = fetch_data(
            bbox=bbox_arizona,
            select_properties=[],
            time_field=self.provider_def["time_field"],
            datetime_filter=latestTime,
            unopened_dataset=get_zarr_dataset_handle(
                self.provider_def["data"], self.provider_def["dataset_path"]
            ),
        )
        features: list[GeojsonFeatureDict] = []
        x_values = result[self.provider_def["x_field"]].values
        y_values = result[self.provider_def["y_field"]].values
        for i, id in enumerate(result["feature_id"].values):
            feature: GeojsonFeatureDict = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        float(x_values[i]),
                        float(y_values[i]),
                    ],
                },
                "id": id,
                "properties": {},
            }

            features.append(feature)
            if i > 500:
                break
        geojsonResponse: GeojsonFeatureCollectionDict = {
            "type": "FeatureCollection",
            "features": features,
        }
        return geojsonResponse

    @crs_transform
    def query(self, **kwargs):
        return self.items(**kwargs)

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
