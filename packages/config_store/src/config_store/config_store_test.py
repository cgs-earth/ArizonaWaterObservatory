# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from packages.config_store.src.config_store import ConfigStoreProcessor


def test_store_and_retrieve():
    processor = ConfigStoreProcessor(
        {
            "id": "test",
            "title": "test",
            "description": "test",
            "name": "test",
        }
    )
    result = processor.execute({"action": "store", "config": {"name": "test"}})
    assert "id" in result[1] and result[1]["id"]

    retrieve = processor.execute({"action": "retrieve", "id": result[1]["id"]})
    assert "config" in retrieve[1]
    assert retrieve[1]["config"]["name"] == "test"
