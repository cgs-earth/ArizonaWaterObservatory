# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from crawler.defs.assets.awdr_groundwater import xlsx_to_zarr


def test_xlsx_to_zarr():
    xlsx_to_zarr(None)
