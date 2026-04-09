# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from lib import filter_data_to_once_a_day, get_smap_data_list_for_arizona


def test_get_list_of_smap_data():
    results = get_smap_data_list_for_arizona()
    assert len(results) > 0
    filtered_data = filter_data_to_once_a_day(results)
    assert len(filtered_data) > 0
    assert len(filtered_data) < len(results)
