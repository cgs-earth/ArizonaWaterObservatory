# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import argparse
import logging
import os
from pathlib import Path
import warnings

import earthaccess
from lib import (
    SMAP_CHECKPOINT_JSON,
    append_hd5_to_s3_zarr,
    filter_data_to_once_a_day,
    filter_data_to_only_new_files,
    get_previously_downloaded_urls,
    get_smap_data_list_for_arizona,
    get_total_size_in_gb,
)
import minio
import s3fs

# filter out unnecessary warnings that we don't care about and just refer to future deprecations;
# some of these can't actually even be addressed so the warning is pointless until future code changes
# if this breaks in the future it will throw an error with pyright anyways so no reason to warn on this
warnings.filterwarnings(
    "ignore", category=FutureWarning, message=r".*DataGranule\.size.*"
)

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)


def main(
    endpoint: str,
    access_key: str,
    secret_key: str,
    bucket: str,
    s3_store_path: str,
    test_mode: bool,
):
    mc = minio.Minio(endpoint, access_key, secret_key, secure=False)

    if not mc.bucket_exists(bucket):
        LOGGER.warning(
            f"Specified bucket '{bucket}' does not exist. Creating bucket {bucket}"
        )
        mc.make_bucket(bucket)

    previously_downloaded_urls = get_previously_downloaded_urls(mc, bucket)
    LOGGER.debug(f"{previously_downloaded_urls=}")
    LOGGER.info(
        f"Found {len(previously_downloaded_urls)} previously downloaded urls in S3 within the checkpoint file: {SMAP_CHECKPOINT_JSON}"
    )

    LOGGER.info("Searching for all SMAP data in Arizona")

    files = get_smap_data_list_for_arizona(test_mode=test_mode)

    LOGGER.info(
        "Filtering down file list to only those not previously downloaded"
    )

    filtered_to_one_file_per_day = filter_data_to_once_a_day(files)

    assert len(filtered_to_one_file_per_day) > 0, (
        "No data to download in filtered_files"
    )

    files_to_download = filter_data_to_only_new_files(
        filtered_to_one_file_per_day, previously_downloaded_urls
    )

    LOGGER.info(
        f"Filtered files to only data not yet downloaded and one file per day. Will download and process {len(files_to_download)} files totaling {get_total_size_in_gb(files_to_download)} GB"
    )

    Path("/tmp/smap_data").mkdir(parents=True, exist_ok=True)

    endpoint_url = endpoint
    if not endpoint.startswith("http"):
        endpoint_url = f"http://{endpoint}"
    s3_fs = s3fs.S3FileSystem(
        key=access_key,
        secret=secret_key,
        client_kwargs={"endpoint_url": endpoint_url},
        use_ssl=False,  # must match http vs https
    )
    for i, file in enumerate(files_to_download):
        downloaded_file_paths = earthaccess.download(
            file, local_path="/tmp/smap_data"
        )

        hd5_file_path = [
            file for file in downloaded_file_paths if file.name.endswith(".h5")
        ]
        assert len(hd5_file_path) == 1, (
            f"Expected 1 hd5 file but found {len(hd5_file_path)}"
        )

        LOGGER.info(
            f"Appending file {i}/{len(files_to_download)}: {hd5_file_path[0].name}"
        )
        append_hd5_to_s3_zarr(
            hd5_file_path[0], s3_fs, bucket, s3_store_path, test_mode
        )

        if test_mode and i > 5:
            LOGGER.warning("Stopping early since test mode was specified")
            break

    LOGGER.info("Done!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Concatenate NASA SMAP hd5 files into Zarr on S3/MinIO"
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
        default=os.environ.get("S3_BUCKET", "iow"),
        help="MinIO/S3 bucket name; Can be set with env var S3_BUCKET",
    )
    parser.add_argument(
        "--s3-store-path",
        default=os.environ.get("S3_STORE_PATH", "smap_data.zarr"),
        help="Name of the Zarr directory within which to store SMAP data on S3; Must end with .zarr; Can be set with env var S3_STORE_PATH",
    )
    parser.add_argument(
        "--test-mode",
        action="store_true",
        help="Download only a subset of SMAP data for testing",
    )

    if not os.environ.get("EARTHDATA_USERNAME") or not os.environ.get(
        "EARTHDATA_PASSWORD"
    ):
        # You can alternatively get a token from https://urs.earthdata.nasa.gov/documentation/for_users/user_token#/api/users/token
        # but as far as I can tell, the token cannot be auto refreshed and thus will require manual renewal after 60 days
        LOGGER.warning(
            "Missing at least one of env vars EARTHDATA_USERNAME or EARTHDATA_PASSWORD; Falling back to cached / interactive login credentials. Without credentials, SMAP data cannot be downloaded. New credentials can be generated here: https://urs.earthdata.nasa.gov/home"
        )

    args = parser.parse_args()
    try:
        main(
            args.endpoint,
            args.access_key,
            args.secret_key,
            args.bucket,
            args.s3_store_path,
            args.test_mode,
        )
    except KeyboardInterrupt:
        LOGGER.warning(
            "Program interrupted by keyboard interrupt; this may have left zarr data in a corrupt or incomplete state; you should remove and re-create the zarr store"
        )
