# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from io import BytesIO
from zipfile import ZipFile

from crawler.defs.assets.lib import get_adwr_link
import dagster as dg
import requests


@dg.asset
def awdr_link(context: dg.AssetExecutionContext):
    url = "https://www.azwater.gov/gis-data-and-maps"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    resp = requests.get(url, headers=headers)

    resp.raise_for_status()

    return get_adwr_link(resp.text)


@dg.asset
def awdr_groundwater(
    context: dg.AssetExecutionContext, awdr_link: str
) -> dg.MaterializeResult:
    url = f"https://www.azwater.gov/{awdr_link}"

    with requests.get(url, stream=True) as resp:
        resp.raise_for_status()
        zip_buffer = BytesIO(resp.content)

        # Open the zip file directly from the buffer
        with ZipFile(zip_buffer) as zip_file:
            # List files in the ZIP
            print("Files in ZIP:", zip_file.namelist())

            # Extract all files to memory or use open() to work with them directly
            for file_name in zip_file.namelist():
                with zip_file.open(file_name) as f:
                    data = f.read()  # Or process file line by line
                    # Example: print first 100 bytes of each file
                    print(f"{file_name}: {data[:100]}")

    return dg.MaterializeResult(metadata={"download_url": url})
