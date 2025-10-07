# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from io import BytesIO
from zipfile import ZipFile

from crawler.lib import get_adwr_link
import dagster as dg
import requests
import pandas


@dg.asset
def get_awdr_link(context: dg.AssetExecutionContext):
    url = "https://www.azwater.gov/gis-data-and-maps"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    resp = requests.get(url, headers=headers)

    resp.raise_for_status()

    return get_adwr_link(resp.text)


@dg.asset
def awdr_groundwater_zip(
    context: dg.AssetExecutionContext, output_dir: str, awdr_link: str
) -> dg.MaterializeResult:
    url = f"https://www.azwater.gov/{awdr_link}"

    with requests.get(url, stream=True) as resp:
        resp.raise_for_status()

        with ZipFile(BytesIO(resp.content)) as zf:
            zf.extractall(output_dir)

    return dg.MaterializeResult()


@dg.asset
def xlsx_to_zarr(context: dg.AssetExecutionContext):
    for  file in output_dir: