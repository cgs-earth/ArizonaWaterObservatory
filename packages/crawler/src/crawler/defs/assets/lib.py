# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import re


def get_adwr_link(data_to_parse):
    regex = r"""<a[^>]+href="([^"]+)"[^>]*>Groundwater Site Inventory<\/a>"""
    result = re.search(regex, data_to_parse)
    if result is None:
        raise RuntimeError("Unable to find link")
    return result.group(1)
