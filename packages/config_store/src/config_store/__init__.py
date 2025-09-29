# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

from dataclasses import dataclass
import json
import logging
from typing import Literal, TypedDict
import uuid

from com.env import REDIS_HOST, REDIS_PORT
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
import redis


class ConfigStoreOptions(TypedDict):
    id: str
    title: str
    description: str


@dataclass
class ConfigSchema:
    name: str
    # TODO ask john and fill in more fields


LOGGER = logging.getLogger(__name__)


#: Process metadata and description
PROCESS_METADATA = {
    "version": "0.1.0",
    "id": "ConfigStore",
    "title": {"en": "Config Store"},
    "description": {"en": "Store and retrieve configuration info"},
    "jobControlOptions": ["sync-execute"],
    "keywords": ["redis", "config", "store"],
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
            "schema": {"type": "object", "contentMediaType": "application/json"},
        }
    },
}


class ConfigStoreProcessor(BaseProcessor):
    """A processor for storing config data in redis"""

    client: redis.Redis

    def __init__(self, processor_def: ConfigStoreOptions):
        """
        Initialize object
        :param processor_def: provider definition
        :returns: pygeoapi.process.hello_world.HelloWorldProcessor
        """

        super().__init__(dict(processor_def), PROCESS_METADATA)
        self.client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
        self.supports_outputs = True

    def execute(
        self, data: dict, outputs=None
    ) -> tuple[Literal["application/json"], dict]:
        try:
            _ = ConfigSchema(**data)
        except Exception as e:
            raise ProcessorExecuteError(
                f"Data {data} does not match the schema and threw error: {e}"
            ) from e
        # reduce uuid length so the urls are of reasonable size
        associated_uuid = uuid.uuid1().int % 1000000
        self.client.set(
            str(associated_uuid),
            json.dumps(data).encode("utf-8"),
        )

        return "application/json", {
            "id": str(associated_uuid),
        }
