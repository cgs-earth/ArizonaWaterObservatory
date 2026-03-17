# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import argparse
import io
import json
import logging
import os
import tempfile

from lib import FileParser, TopLevelFolderParser
import minio
import requests
import s3fs
import xarray as xr

BASE_URL = "https://nasagrace.unl.edu"

LOGGER = logging.getLogger(__name__)


def append_netcdf_to_s3_zarr(
    netcdf_bytes: bytes, s3_fs, bucket: str, store_name: str
):
    """
    Write NetCDF bytes to a temp file, open with xarray, and append to S3 Zarr store using fsspec mapper.
    """
    import os

    # Write NetCDF to temporary file
    with tempfile.NamedTemporaryFile(suffix=".nc4", delete=False) as tmp_file:
        tmp_file.write(netcdf_bytes)
        tmp_path = tmp_file.name

    try:
        ds = xr.open_dataset(tmp_path, engine="netcdf4")
        ds = ds.where(ds != -999)  # handle missing values

        # Create fsspec mapper for Zarr store
        zarr_mapper = s3_fs.get_mapper(f"{bucket}/{store_name}")

        # Check if store exists by checking if it has any keys
        store_exists = bool(list(zarr_mapper.keys()))

        if store_exists:
            # Append along 'time'
            ds.to_zarr(
                store=zarr_mapper,
                mode="a",
                append_dim="time",
                consolidated=True,
                zarr_format=2,
            )
        else:
            # Create new store; do NOT set append_dim
            ds.to_zarr(
                store=zarr_mapper,
                mode="w",
                consolidated=True,
                zarr_format=2,
            )

    finally:
        os.remove(tmp_path)


def fetch_and_append(file_link: str, s3_fs, bucket: str, store_name: str):
    response = requests.get(f"{BASE_URL}/{file_link}")
    response.raise_for_status()
    append_netcdf_to_s3_zarr(response.content, s3_fs, bucket, store_name)


def main(
    endpoint: str,
    access_key: str,
    secret_key: str,
    bucket: str,
    s3_store_name: str,
    test_mode: bool = False,
):
    minio_client = minio.Minio(endpoint, access_key, secret_key, secure=False)
    try:
        existing_data = minio_client.get_object(
            object_name="stored_files.json", bucket_name=bucket
        )
    except minio.error.S3Error:
        existing_data = None

    if not existing_data:
        print("No metadata from previous download found")
        previously_downloaded_urls = []
    else:
        existing_data = json.loads(existing_data.read().decode("utf-8"))
        previously_downloaded_urls = existing_data[
            "previously_downloaded_urls"
        ]

    # Use s3fs with MinIO/S3 credentials
    endpoint_url = endpoint
    if not endpoint.startswith("http"):
        endpoint_url = f"http://{endpoint}"
    s3_fs = s3fs.S3FileSystem(
        key=access_key,
        secret=secret_key,
        client_kwargs={"endpoint_url": endpoint_url},
        use_ssl=False,  # must match http vs https
    )

    # Download top-level page
    response = requests.get(f"{BASE_URL}/ConusData.aspx")
    response.raise_for_status()

    parser = TopLevelFolderParser()
    parser.feed(response.text)
    print(f"Found {len(parser.links)} folders")

    downloaded_urls = set()

    for i, link in enumerate(parser.links):
        if link["text"] in ["current", "NASApublication", "Web"]:
            continue

        folder_response = requests.get(f"{BASE_URL}/{link['href']}")
        folder_response.raise_for_status()

        file_parser = FileParser()
        file_parser.feed(folder_response.text)

        for file_link in file_parser.links:
            if file_link in previously_downloaded_urls:
                print(f"Skipping previously downloaded file {file_link}")
                continue
            else:
                downloaded_urls.add(file_link)
                fetch_and_append(file_link, s3_fs, bucket, s3_store_name)

        print(f"Completed folder {i + 1}/{len(parser.links)}")
        if test_mode:
            break

    # merge existing data urls with new data urls
    data_in_object_store = previously_downloaded_urls + list(downloaded_urls)

    jsonAsBytes = json.dumps(
        {"previously_downloaded_urls": data_in_object_store}
    ).encode("utf-8")
    binioJson = io.BytesIO(jsonAsBytes)
    minio_client.put_object(
        object_name="stored_files.json",
        bucket_name=bucket,
        data=binioJson,
        length=len(jsonAsBytes),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Concatenate NASA GRACE NetCDF files into Zarr on S3/MinIO"
    )
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("S3_ENDPOINT", "localhost:9000"),
        help="MinIO/S3 endpoint URL",
    )
    parser.add_argument(
        "--access-key",
        default=os.environ.get("S3_ACCESS_KEY", "minioadmin"),
        help="MinIO/S3 access key",
    )
    parser.add_argument(
        "--secret-key",
        default=os.environ.get("S3_SECRET_KEY", "minioadmin"),
        help="MinIO/S3 secret key",
    )
    parser.add_argument(
        "--bucket",
        default=os.environ.get("S3_BUCKET", "grace"),
        help="MinIO/S3 bucket name",
    )
    parser.add_argument(
        "--s3-store-name",
        default="grace_data.zarr",
        help="Zarr store name on S3",
    )
    parser.add_argument(
        "--test-mode",
        action="store_true",
        help="Download only a subset for testing",
    )

    args = parser.parse_args()
    main(
        args.endpoint,
        args.access_key,
        args.secret_key,
        args.bucket,
        args.s3_store_name,
        args.test_mode,
    )
