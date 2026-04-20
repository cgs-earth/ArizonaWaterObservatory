# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import datetime
from pathlib import Path

from lib import (
    filter_data_to_once_a_day,
    get_smap_data_list_for_arizona,
    parse_time_from_path,
)


def test_get_list_of_smap_data():
    results = get_smap_data_list_for_arizona()
    assert len(results) > 0
    filtered_data = filter_data_to_once_a_day(results)
    assert len(filtered_data) > 0
    assert len(filtered_data) < len(results)


def test_parse_time_from_path():
    path = Path("/tmp/smap/SMAP_L4_SM_gph_20150331T013000_Vv8010_001.h5")
    assert parse_time_from_path(path) == datetime.datetime(
        2015, 3, 31, 1, 30, 0
    )
