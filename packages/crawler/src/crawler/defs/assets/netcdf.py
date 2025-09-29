# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import gc
from glob import glob
import io
import os
from pathlib import Path
import zipfile

import dagster as dg
import requests
import xarray as xr

"""
This file creates a zarr file that represents all parts of the 
national water model that are relevant to Arizona.

It may take over an hour to download all the zip data from the source. 
It will result in netcdf files in the downloads/ directory that total over 
50GB
"""

logger = dg.get_dagster_logger()


def get_id_from_url(url: str):
    """A unique ID for naming directories of downloaded files"""
    return url.split("/")[-1].removesuffix(".zip")


partitions = dg.StaticPartitionsDefinition(
    [
        "https://storage.googleapis.com/water-data-portal-storage/ET.nonnegative.zip",
        "https://storage.googleapis.com/water-data-portal-storage/ET.zip",
        "https://storage.googleapis.com/water-data-portal-storage/NWM_1981_2020.zip",
        "https://storage.googleapis.com/water-data-portal-storage/SNEQV.zip",
        "https://storage.googleapis.com/water-data-portal-storage/const.zip",
        "https://storage.googleapis.com/water-data-portal-storage/depth.zip",
        "https://storage.googleapis.com/water-data-portal-storage/inflow.zip",
        "https://storage.googleapis.com/water-data-portal-storage/lwdown.zip",
        "https://storage.googleapis.com/water-data-portal-storage/precip.zip",
        "https://storage.googleapis.com/water-data-portal-storage/psfc.zip",
        "https://storage.googleapis.com/water-data-portal-storage/q2d.zip",
        "https://storage.googleapis.com/water-data-portal-storage/qBucket.zip",
        "https://storage.googleapis.com/water-data-portal-storage/qSfcLatRunoff.zip",
        "https://storage.googleapis.com/water-data-portal-storage/q_lateral.zip",
        "https://storage.googleapis.com/water-data-portal-storage/swdown.zip",
        "https://storage.googleapis.com/water-data-portal-storage/t2d.zip",
        "https://storage.googleapis.com/water-data-portal-storage/u2d.zip",
        "https://storage.googleapis.com/water-data-portal-storage/v2d.zip",
    ]
)


@dg.asset(partitions_def=partitions)
def download_netcdf(context: dg.AssetExecutionContext) -> None:
    url = context.partition_key
    logger.info(f"Downloading {url}")

    output_dir = Path(__file__).parent / "downloads" / get_id_from_url(url)
    output_dir.mkdir(exist_ok=True)

    s = requests.Session()
    with s.get(url, stream=True) as r:
        r.raise_for_status()
        total_size = int(r.headers.get("content-length", 0))
        downloaded = 0
        ten_mb_chunk_size = 1024 * 1024 * 10

        # Use a BytesIO buffer to unzip on the fly
        zip_buffer = io.BytesIO()
        for chunk in r.iter_content(chunk_size=ten_mb_chunk_size):
            zip_buffer.write(chunk)
            downloaded += len(chunk)
            if total_size != 0:
                percent = (downloaded / total_size) * 100
                logger.info(f"Downloading {url}, {percent:.2f}% complete")

        zip_buffer.seek(0)
        with zipfile.ZipFile(zip_buffer) as zf:
            logger.info(f"Extracting {get_id_from_url(url)} to {output_dir}")
            zf.extractall(output_dir)
            logger.info("Extraction complete")


def assert_all_datasets_have_same_variables(datasets: list[str]) -> None:
    dsToVars = {}

    for dataset_name in datasets:
        opened_dataset = xr.open_dataset(dataset_name)
        dsToVars[dataset_name] = list(opened_dataset.variables.keys())

    for dataset_name in datasets:
        if dsToVars[dataset_name] != dsToVars[datasets[0]]:
            raise ValueError(
                f"Dataset {dataset_name} has different variables than {datasets[0]}"
            )


@dg.asset(deps=[download_netcdf])
def concat_netcdf_into_zarr(context: dg.AssetExecutionContext) -> None:
    download_dir = Path(__file__).parent / "downloads"
    zarr_dir = Path(__file__).parent / "zarr"
    zarr_dir.mkdir(exist_ok=True)

    dirs = [d for d in os.listdir(download_dir) if not d.startswith(".")]

    for dir_name in dirs:
        context.log.info(f"Processing {dir_name}")
        nc_files = glob(str(download_dir / dir_name / "*.nc"))
        if not nc_files:
            context.log.warning(f"No NetCDF files found in {dir_name}")
            continue

        out_path = zarr_dir / f"{dir_name}.zarr"

        ds_batch = xr.open_mfdataset(
            nc_files,
            combine="by_coords",
            decode_times=True,
            parallel=False,  # dask can throw errors or OOM issues if parallelized
            join="outer",
        )

        ds_batch.to_zarr(out_path, mode="w")

        # Clean up
        ds_batch.close()
        del ds_batch
        gc.collect()

        context.log.info(f"All batches combined into {out_path}")
