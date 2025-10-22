# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from io import BytesIO
import os
from pathlib import Path
from zipfile import ZipFile

from crawler.lib import (
    add_shapefile_info_to_dataset,
    get_adwr_link,
    upload_dataset_to_s3,
    xlsx_to_xarray,
)
import dagster as dg
import requests
import xarray

LATEST_EXPORT = "20250714"
ARIZONA_GROUNDWATER_XLSX_UNZIPPED_FOLDER = (
    Path(__file__).parent / f"GWSI_ZIP_{LATEST_EXPORT}"
)


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
    context: dg.AssetExecutionContext, get_awdr_link: str
) -> dg.MaterializeResult:
    url = f"https://www.azwater.gov/{get_awdr_link}"

    with requests.get(url, stream=True) as resp:
        resp.raise_for_status()

        with ZipFile(BytesIO(resp.content)) as zf:
            zf.extractall(ARIZONA_GROUNDWATER_XLSX_UNZIPPED_FOLDER)

    return dg.MaterializeResult()


@dg.asset
def xlsx_to_zarr(context: dg.AssetExecutionContext):
    endpoint = os.environ.get("S3_ENDPOINT", "http://localhost:9000")
    access_key = os.environ.get("S3_ACCESS_KEY", "minioadmin")
    secret_key = os.environ.get("S3_SECRET_KEY", "minioadmin")
    bucket = os.environ.get("S3_BUCKET", "iow")

    for file in ARIZONA_GROUNDWATER_XLSX_UNZIPPED_FOLDER.iterdir():
        if not file.is_dir():
            continue

        if file.name == "Data_Tables":
            for path in file.glob("*.xlsx"):
                if not path.is_file():
                    continue

                try:
                    dataset = xlsx_to_xarray(path)
                except Exception as e:
                    raise RuntimeError(
                        f"Failed to convert xlsx file '{path}' got error: {e}"
                    ) from e

                dataset = add_shapefile_info_to_dataset(
                    Path(__file__).parent / "GWSI_ZIP_20250714" / "Shape",
                    dataset,
                    path.name,
                )

                assert len(dataset.dims) > 0

                for date in ["WELM_DATE_MEASURED"]:
                    if date in dataset:
                        dataset[date] = xarray.DataArray(
                            dataset[date].values.astype("datetime64[ns]"),
                            dims=dataset[date].dims,
                            coords=dataset[date].coords,
                            attrs=dataset[date].attrs,
                        )
                assert len(dataset.dims) > 0

                upload_dataset_to_s3(
                    dataset,
                    zarr_path=f"s3://{bucket}/{path.name.removesuffix('.xlsx')}.zarr",
                    access_key=access_key,
                    secret_key=secret_key,
                    endpoint_url=endpoint,
                )
