# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import argparse
import logging
import os

import numpy as np
import pandas as pd
import requests
import rioxarray  # noqa: F401 need to import this for rioxarray to work
import s3fs
import xarray as xr

LOGGER = logging.getLogger(__name__)
LOGGER.setLevel(logging.INFO)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)

formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
handler.setFormatter(formatter)

LOGGER.addHandler(handler)


GRACE_DOWNLOAD_LINK = "https://download.csr.utexas.edu/outgoing/grace/RL0603_mascons/CSR_GRACE_GRACE-FO_RL0603_Mascons_all-corrections.nc"
DEFAULT_CACHE_PATH = "/tmp/grace_mascons_cache.nc"


def create_s3_filesystem(endpoint: str, access_key: str, secret_key: str):
    """
    Create an S3FS filesystem (works with AWS S3 or MinIO).
    """
    endpoint_url = endpoint
    if not endpoint.startswith("http"):
        endpoint_url = f"http://{endpoint}"

    return s3fs.S3FileSystem(
        key=access_key,
        secret=secret_key,
        client_kwargs={"endpoint_url": endpoint_url},
        use_ssl=False,
    )


def download_netcdf(cache_path: str) -> str:
    """
    Download the GRACE NetCDF file to cache_path if not already present.
    Returns the path to the file.
    """
    if os.path.exists(cache_path):
        LOGGER.info(f"Using cached file at '{cache_path}'")
        return cache_path

    LOGGER.info(f"Downloading {GRACE_DOWNLOAD_LINK} to '{cache_path}'")

    try:
        response = requests.get(GRACE_DOWNLOAD_LINK, stream=True)
        response.raise_for_status()
    except requests.exceptions.SSLError:
        # sometimes the upstream server seems to have the ssl certs out of date
        # this is a workaround
        LOGGER.info(
            "SSL error with the upstream GRACE fileserver, retrying with verify=False"
        )
        response = requests.get(GRACE_DOWNLOAD_LINK, stream=True, verify=False)
        response.raise_for_status()

    with open(cache_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    LOGGER.info(f"Download complete, cached at '{cache_path}'")
    return cache_path


def convert_netcdf_to_s3_zarr(
    s3_fs: s3fs.S3FileSystem,
    store_path: str,
    cache_path: str,
):
    """
    Download NetCDF (or use cached copy) and write to S3-backed Zarr store.
    """
    LOGGER.info(f"Storing into S3 Zarr store at '{store_path}'")

    nc_path = download_netcdf(cache_path)

    ds = xr.open_dataset(nc_path, engine="netcdf4", decode_times=False)

    # Manually decode time
    time_values = xr.coding.times.decode_cf_datetime(  # pyright: ignore[reportAttributeAccessIssue]
        ds["time"].values,
        units="days since 2002-01-01T00:00:00Z",
        calendar="gregorian",
    )

    # Snap to month-start, drop duplicates
    month_starts = pd.DatetimeIndex(time_values).to_period("M").to_timestamp()
    _, unique_idx = np.unique(month_starts, return_index=True)
    ds = ds.isel(time=unique_idx)
    ds["time"] = month_starts[unique_idx].astype("datetime64[ns]")

    # Strip conflicting time attrs
    ds["time"].attrs.pop("calendar", None)
    ds["time"].attrs.pop("units", None)
    ds["time"].attrs.pop("Units", None)

    # Shift lon from 0-360 to -180-180
    # this is in the proper crs but for some reason it is offset by 180 so we need to fix
    ds = ds.assign_coords(lon=(((ds.lon + 180) % 360) - 180))
    ds = ds.sortby("lon")

    # Set CRS for rioxarray
    ds = ds.rio.set_spatial_dims(x_dim="lon", y_dim="lat")
    ds = ds.rio.write_crs("EPSG:4326")

    if "lwe_thickness" in ds.data_vars:
        ds["lwe_thickness"].attrs["units"] = "cm"
        ds["lwe_thickness"].attrs["long_name"] = ds["lwe_thickness"].attrs.get(
            "long_name", "Liquid water equivalent thickness"
        )

    time_encoding = {
        "time": {
            "dtype": "int64",
            "units": "hours since 2002-04-01 00:00:00",
        }
    }

    mapper = s3_fs.get_mapper(store_path)

    LOGGER.info("Writing Zarr store directly to S3...")

    ds.to_zarr(
        store=mapper,
        mode="w",
        consolidated=True,
        zarr_format=2,
        encoding=time_encoding,
    )

    LOGGER.info("Finished writing Zarr to S3")


def main():
    parser = argparse.ArgumentParser(
        description="Convert NetCDF to Zarr and upload to S3 via s3fs"
    )

    parser.add_argument(
        "--endpoint",
        default=os.environ.get("S3_ENDPOINT", "localhost:9000"),
        help="MinIO/S3 endpoint URL; Can be set with env var S3_ENDPOINT",
    )
    parser.add_argument(
        "--access-key",
        default=os.environ.get("S3_ACCESS_KEY", "minioadmin"),
        help="MinIO/S3 access key; Can be set with env var S3_ACCESS_KEY",
    )
    parser.add_argument(
        "--secret-key",
        default=os.environ.get("S3_SECRET_KEY", "minioadmin"),
        help="MinIO/S3 secret key; Can be set with env var S3_SECRET_KEY",
    )
    parser.add_argument(
        "--bucket",
        default=os.environ.get("S3_BUCKET", "grace_data_bucket"),
        help="MinIO/S3 bucket name; Can be set with env var S3_BUCKET",
    )
    parser.add_argument(
        "--s3-store-path",
        default=os.environ.get("S3_STORE_PATH", "texas_grace_data.zarr"),
        help="Name of the Zarr directory within which to store GRACE data on S3; Must end with .zarr; Can be set with env var S3_STORE_PATH",
    )
    parser.add_argument(
        "--cache-path",
        default=os.environ.get("GRACE_CACHE_PATH", DEFAULT_CACHE_PATH),
        help=f"Local path to cache the downloaded NetCDF file; Can be set with env var GRACE_CACHE_PATH (default: {DEFAULT_CACHE_PATH})",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Ignore any cached file and force a fresh download",
    )

    args = parser.parse_args()

    if args.no_cache and os.path.exists(args.cache_path):
        LOGGER.info(f"--no-cache set, removing '{args.cache_path}'")
        os.remove(args.cache_path)

    s3_fs = create_s3_filesystem(
        endpoint=args.endpoint,
        access_key=args.access_key,
        secret_key=args.secret_key,
    )

    convert_netcdf_to_s3_zarr(
        s3_fs=s3_fs,
        store_path=f"{args.bucket}/{args.s3_store_path}",
        cache_path=args.cache_path,
    )

    LOGGER.info("Done")


if __name__ == "__main__":
    main()


# http://localhost:5005/collections/TEXAS_GRACE/cube?f=html&bbox=-200.5,-0,-10.7,100&parameter-name=lwe_thickness&datetime=2020-01-01/..
