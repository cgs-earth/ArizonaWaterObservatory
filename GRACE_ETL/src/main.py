# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import datetime
import io
import os

from lib import FileParser, TopLevelFolderParser
from minio import Minio
from minio.error import S3Error
import requests


def upload_to_s3(client: Minio, file_bytes: bytes, s3_path: str, bucket: str):
    """Upload bytes to S3/MinIO."""
    try:
        client.put_object(
            bucket_name=bucket,
            object_name=s3_path,
            data=io.BytesIO(file_bytes),
            length=len(file_bytes),
            content_type="image/tiff",
        )
        print(f"Uploaded to {s3_path}")
    except S3Error as e:
        print(f"Failed to upload {s3_path}: {e}")


def fetch_and_upload(
    client: Minio, bucket: str, base_url: str, file_link: str
):
    """Fetch a GeoTIFF file and upload it to S3."""
    geotiff_url = f"{base_url}{file_link}"
    date_str = file_link.split("data/")[1].split("/")[0]
    python_date = datetime.datetime.strptime(date_str, "%Y%m%d").date()

    parameter: str = file_link.split("/")[3]
    if parameter.startswith("sfsm"):
        parameter = "SURFACE_WATER"
    elif parameter.startswith("rtzsm"):
        parameter = "ROOT_SOIL_MOISTURE"
    elif parameter.startswith("gws"):
        parameter = "GROUND_WATER"
    else:
        raise ValueError(f"Unknown parameter: {parameter}")

    print(f"Downloading {parameter} {python_date} from {geotiff_url}")
    tiff_response = requests.get(geotiff_url)
    tiff_response.raise_for_status()

    s3_path = f"{parameter}/{python_date}/data.tif"
    upload_to_s3(client, tiff_response.content, s3_path, bucket)


def main(
    access_key: str,
    secret_key: str,
    endpoint: str,
    bucket: str,
    test_mode: bool = False,
):
    client = Minio(
        endpoint, access_key=access_key, secret_key=secret_key, secure=False
    )
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)

    BASE_URL = "https://nasagrace.unl.edu"
    response = requests.get(f"{BASE_URL}/ConusData.aspx")
    response.raise_for_status()

    parser = TopLevelFolderParser()
    parser.feed(response.text)

    print(f"Found {len(parser.links)} folders")

    # Create a thread pool for concurrent downloads/uploads
    with ThreadPoolExecutor(max_workers=1 if test_mode else 10) as executor:
        futures = []
        for link in parser.links:
            if link["text"] in ["current", "NASApublication", "Web"]:
                continue

            print(f"Processing folder: {BASE_URL}/{link['href']}")
            folder_response = requests.get(f"{BASE_URL}/{link['href']}")
            folder_response.raise_for_status()

            file_parser = FileParser()
            file_parser.feed(folder_response.text)

            for file_link in file_parser.links:
                futures.append(
                    executor.submit(
                        fetch_and_upload, client, bucket, BASE_URL, file_link
                    )
                )
            if test_mode:
                print("Exiting early for testing")
                break

        # Wait for all tasks to complete
        for future in as_completed(futures):
            try:
                future.result()
            except Exception as e:
                print(f"Error processing file: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Upload NASA GRACE GeoTIFFs to MinIO/S3"
    )
    parser.add_argument(
        "--endpoint",
        default=os.environ.get("S3_ENDPOINT", "localhost:9000"),
        help="MinIO/S3 endpoint",
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
        "--test-mode",
        action="store_true",
        help="Run in test mode to ensure a subset of the data works",
    )

    args = parser.parse_args()

    try:
        main(
            args.access_key,
            args.secret_key,
            args.endpoint,
            args.bucket,
            args.test_mode,
        )
    except KeyboardInterrupt:
        print("Interrupted by user")
