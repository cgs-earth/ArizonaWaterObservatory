# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: MIT

from dataclasses import dataclass
import json
import logging
from typing import Literal, NotRequired, TypedDict
import uuid

from com.env import REDIS_HOST, REDIS_PORT
from pygeoapi.process.base import BaseProcessor, ProcessorExecuteError
import redis


class ProcessorOptions(TypedDict):
    """Options for configuring hte provider in redis"""

    id: str
    title: str
    name: str
    description: str


@dataclass
class ConfigSchema:
    """The config to be stored in redis."""

    name: str
    # TODO ask john and fill in more fields


class ExecutionInput(TypedDict):
    """The data that"""

    action: Literal["store", "retrieve"]
    # Must comply to the config schema
    config: NotRequired[dict]
    id: NotRequired[str]


class ExecutionResponse(TypedDict):
    """
    The json response that the processor returns. Both are required since the Python type
    system doesn't allow disciminated unions
    """

    id: NotRequired[str]
    # Must comply to the config schema
    config: NotRequired[dict]


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

    def __init__(self, processor_def: ProcessorOptions):
        """
        Initialize object
        :param processor_def: provider definition
        :returns: pygeoapi.process.hello_world.HelloWorldProcessor
        """

        super().__init__(dict(processor_def), PROCESS_METADATA)
        self.client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT)
        self.supports_outputs = True

    def execute(  # pyright: ignore[reportIncompatibleMethodOverride]
        self,
        data: ExecutionInput,
        outputs=None,
    ) -> tuple[Literal["application/json"], ExecutionResponse]:
        if not data or "action" not in data:
            raise ProcessorExecuteError(
                "Missing an action to perform. You must either 'store' or 'retrieve' a config."
            )

        if data["action"] == "retrieve":
            if "id" not in data:
                raise ProcessorExecuteError("Missing an id to retrieve")

            retrievedData = self.client.get(data["id"])
            return "application/json", json.loads(retrievedData)  # pyright: ignore[reportArgumentType] redis py doesn't type properly
        elif data["action"] == "store":
            if "config" not in data:
                raise ProcessorExecuteError("Missing a config to store")

            try:
                _ = ConfigSchema(**data["config"])
            except Exception as e:
                raise ProcessorExecuteError(
                    f"Data {data} does not match the schema and threw error: {e}"
                ) from e

            # reduce uuid length so the urls are of reasonable size for sharing in a url. Extremely unlikely to have enough users to collide
            associated_uuid = uuid.uuid1().int % 1000000
            self.client.set(
                str(associated_uuid),
                json.dumps(data).encode("utf-8"),
            )

            return "application/json", {
                "id": str(associated_uuid),
            }

        else:
            raise ProcessorExecuteError(
                f"Unrecognized action: {data['action']}. You must either 'store' or 'retrieve' a config."
            )
