# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from config_store import ConfigStoreProcessor


def test_store_and_retrieve():
    processor = ConfigStoreProcessor(
        {
            "id": "test",
            "title": "test",
            "description": "test",
            "name": "test",
        }
    )
    mimeType, config = processor.execute({"name": "test"})
    assert mimeType == "application/json"
    assert config["name"] == "test"
