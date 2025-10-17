# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

import logging
from typing import Literal, TypedDict

from pygeoapi.process.base import BaseProcessor


class ProcessorOptions(TypedDict):
    """Options for configuring the processor."""

    id: str
    title: str
    name: str
    description: str


# @dataclass
# class ConfigSchema:
#     """The config to be stored in the manager."""

#     name: str
#     # TODO ask john and fill in more fields


LOGGER = logging.getLogger(__name__)


#: Process metadata and description
PROCESS_METADATA = {
    "version": "0.1.0",
    "id": "ConfigStore",
    "title": {"en": "Config Store"},
    "description": {"en": "Store and retrieve configuration info"},
    "jobControlOptions": ["sync-execute", "async-execute"],
    "keywords": ["config", "store"],
    "inputs": {
        "name": {
            "title": "Name",
            "description": "A human-readable name identifying the config",
            "schema": {"type": "string"},
            "minOccurs": 1,
            "maxOccurs": 1,
        },
    },
    "outputs": {
        "stored_id": {
            "title": "Stored ID",
            "description": "The ID of the stored config object",
            "schema": {
                "type": "object",
                "contentMediaType": "application/json",
            },
        }
    },
}


class ConfigStoreProcessor(BaseProcessor):
    """A processor for storing config data"""

    def __init__(self, processor_def: ProcessorOptions):
        """
        Initialize object
        :param processor_def: provider definition
        :returns: pygeoapi.process.hello_world.HelloWorldProcessor
        """

        super().__init__(dict(processor_def), PROCESS_METADATA)
        self.supports_outputs = True

    def execute(  # pyright: ignore[reportIncompatibleMethodOverride]
        self,
        data: dict,
        outputs=None,
    ) -> tuple[Literal["application/json"], dict]:
        # try:
        #     _ = ConfigSchema(**data)
        # except Exception as e:
        #     raise ProcessorExecuteError(
        #         f"Data {data} does not match the schema and threw error: {e}"
        #     ) from e

        # the result of the job will be stored in the job manager
        # thus making it so we don't need to worry about storing it in the db
        # in our integration code. as a result we just return the data directly
        # as a pass through
        return "application/json", data
