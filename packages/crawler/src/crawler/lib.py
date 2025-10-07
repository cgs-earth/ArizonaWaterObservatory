# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path
import re

import pandas as pd
import s3fs
import xarray as xr


def get_adwr_link(data_to_parse):
    regex = r"""<a[^>]+href="([^"]+)"[^>]*>Groundwater Site Inventory<\/a>"""
    result = re.search(regex, data_to_parse)
    if result is None:
        raise RuntimeError("Unable to find link")
    return result.group(1)


def xlsx_to_xarray(xlsx_file: Path) -> xr.Dataset:
    return pd.read_excel(xlsx_file).to_xarray()


def upload_dataset_to_s3(xlsx_file: Path, endpoint: s3fs.S3FileSystem) -> None:
    dataset = xlsx_to_xarray(xlsx_file)

    dataset.to_zarr(
        store=endpoint.get_mapper("/"), mode="w", consolidated=True
    )
