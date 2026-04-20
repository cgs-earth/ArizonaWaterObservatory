# Copyright 2026 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import datetime
import io
import json
import logging
import os
from pathlib import Path
from zoneinfo import ZoneInfo

import earthaccess
import minio
import pandas as pd
import pyproj
from pyproj import Transformer
import xarray as xr

LOGGER = logging.getLogger(__name__)

SMAP_CHECKPOINT_JSON = "stored_smap_files.json"


def get_previously_downloaded_urls(mc: minio.Minio, bucket) -> list[str]:
    """Try to source the list of previously downloaded urls from the object store"""
    try:
        existing_data = mc.get_object(
            object_name=SMAP_CHECKPOINT_JSON, bucket_name=bucket
        )
    except minio.error.S3Error:
        existing_data = None

    if not existing_data:
        LOGGER.info("No metadata from previous download found")
        previously_downloaded_urls = []
    else:
        existing_data = json.loads(existing_data.read().decode("utf-8"))
        previously_downloaded_urls = existing_data[
            "previously_downloaded_urls"
        ]
    return previously_downloaded_urls


def update_checkpoint(mc: minio.Minio, bucket: str, new_url: str):
    previously_downloaded_urls = get_previously_downloaded_urls(mc, bucket)

    # make is a set to ensure no duplicates
    data_in_object_store = list(set(previously_downloaded_urls + [new_url]))

    jsonAsBytes = json.dumps(
        {"previously_downloaded_urls": data_in_object_store}
    ).encode("utf-8")
    binioJson = io.BytesIO(jsonAsBytes)
    mc.put_object(
        object_name=SMAP_CHECKPOINT_JSON,
        bucket_name=bucket,
        data=binioJson,
        length=len(jsonAsBytes),
    )


def get_smap_data_list_for_arizona(test_mode: bool = False):
    earthaccess.login(persist=True)

    ARIZONA_BBOX = (-115.04883, 31.12820, -108.58887, 37.12529)

    # There are multiple SMAP datasets; they are listed all here:
    # https://nsidc.org/data/smap/data we choose SPL4SMGP
    # sionce it has over 10 years of data, is continuously updated
    # and has both soil and root moisture
    SMAP_DATASET = "SPL4SMGP"

    # fetch up until next month to ensure we get all data
    next_month = (
        datetime.datetime.now() + datetime.timedelta(days=30)
    ).strftime("%Y-%m")
    # get significantly less data if it test mode
    arbitrary_early_date_before_start_of_data = (
        "1900-01" if not test_mode else "2025-01-01"
    )

    results = earthaccess.search_data(
        short_name=SMAP_DATASET,
        bounding_box=ARIZONA_BBOX,
        temporal=(arbitrary_early_date_before_start_of_data, next_month),
    )

    return results


def filter_data_to_once_a_day(
    results: list[earthaccess.DataGranule],
) -> list[earthaccess.DataGranule]:
    """
    Given a list of DataGranule objects which each represent one
    hd5 dataset for SMAP, filter it down to include one for each day;
    This reduces the amount of data we have to download since we don't
    need extremely fine grained data

    For each day, we store the observation that is closest to 9am Arizona Time
    in order to keep observations relatively uniform and comparable
    """

    day_to_associated_granule: dict[
        str, tuple[datetime.datetime, earthaccess.DataGranule]
    ] = {}

    target_hour = 9
    az_tz = ZoneInfo("America/Phoenix")  # Arizona time (no DST)

    for granule in results:
        # Extract timestamp string
        first_observation_time = granule["umm"]["TemporalExtent"][
            "RangeDateTime"
        ]["BeginningDateTime"]

        # Parse into datetime (assumes ISO format with Z)
        dt_utc = datetime.datetime.fromisoformat(
            first_observation_time.replace("Z", "+00:00")
        )

        # Convert to Arizona time
        dt_az = dt_utc.astimezone(az_tz)

        # Extract day key
        year_month_day = dt_az.date().isoformat()

        # Compute distance from 9 AM
        target_time = dt_az.replace(
            hour=target_hour, minute=0, second=0, microsecond=0
        )
        time_diff = abs((dt_az - target_time).total_seconds())

        # Store if:
        # - first entry for the day
        # - or closer to 9 AM than existing one
        if year_month_day not in day_to_associated_granule:
            day_to_associated_granule[year_month_day] = (dt_az, granule)
        else:
            existing_dt, _ = day_to_associated_granule[year_month_day]
            existing_target = existing_dt.replace(
                hour=target_hour, minute=0, second=0, microsecond=0
            )
            existing_diff = abs(
                (existing_dt - existing_target).total_seconds()
            )

            if time_diff < existing_diff:
                day_to_associated_granule[year_month_day] = (dt_az, granule)

    filtered_results: list[earthaccess.DataGranule] = []

    for (
        _time,
        data_granule_result,
    ) in day_to_associated_granule.values():
        filtered_results.append(data_granule_result)

    return filtered_results


def get_hd5_file_url(file: earthaccess.DataGranule) -> str:
    """
    Given a DataGranule object, return the link to the hd5 file that
    can be used to download the data
    """
    data_links: list[str] = file.data_links()
    hd5_links = []
    for link in data_links:
        if link.endswith(".h5"):
            hd5_links.append(link)
    assert len(hd5_links) == 1, (
        f"Expected 1 hd5 link but found {len(hd5_links)}"
    )
    return hd5_links[0]


def filter_data_to_only_new_files(
    files: list[earthaccess.DataGranule],
    previously_downloaded_files: list[str],
) -> list[earthaccess.DataGranule]:
    if len(previously_downloaded_files) == 0:
        LOGGER.warning(
            "No previously downloaded files were found to filter out; this means all files will be downloaded"
        )
        return files

    filtered_results: list[earthaccess.DataGranule] = []

    for file in files:
        hd5_link = get_hd5_file_url(file)

        if hd5_link not in previously_downloaded_files:
            filtered_results.append(file)

    return filtered_results


def get_total_size_in_gb(files: list[earthaccess.DataGranule]) -> float:
    """Given a list of datasets"""
    total_size_in_mb = sum([file.size() for file in files])

    return total_size_in_mb / 1024


def parse_time_from_path(hd5_file_path: Path):
    """Given a hd5 file path from NASA SMAP, extract the time it is associated with"""
    timestamp_str = hd5_file_path.name.split("_")[4]
    return datetime.datetime.strptime(timestamp_str, "%Y%m%dT%H%M%S")


def append_hd5_to_s3_zarr(
    hd5_file_path: Path,
    s3_fs,
    bucket: str,
    store_name: str,
    test_mode: bool = False,
):
    """
    Open hd5 file with xarray, reproject cell_lat/cell_lon to EASE2 meters,
    and append to S3 Zarr store using fsspec mapper.
    """
    root = xr.open_dataset(
        hd5_file_path,
        engine="h5netcdf",
        phony_dims="sort",
    )

    geo = xr.open_dataset(
        hd5_file_path,
        engine="h5netcdf",
        group="Geophysical_Data",
        phony_dims="sort",
    )

    ds = xr.merge([geo, root[["cell_lat", "cell_lon"]]])

    # Drop CRS metadata variable that has inconsistent dimensions across files
    ds = ds.drop_vars("EASE2_global_projection", errors="ignore")

    # Drop HDF5 dimension scale artifacts that aren't Zarr-serializable
    for var in list(ds.data_vars) + list(ds.coords):
        ds[var].attrs.pop("DIMENSION_LABELS", None)

    # --- Reproject cell_lat/cell_lon to EASE2 meters and assign as x/y coords ---
    transformer = Transformer.from_crs(
        "EPSG:4326", "EPSG:6933", always_xy=True
    )

    lons = ds["cell_lon"].values
    lats = ds["cell_lat"].values

    x_meters, y_meters = transformer.transform(lons, lats)

    # EASE2 is a regular grid, so collapse to 1D by taking the first row/col
    x_1d = x_meters[0, :]  # x varies along columns
    y_1d = y_meters[:, 0]  # y varies along rows

    # Get the phony dim names that correspond to spatial axes
    phony_y, phony_x = ds[
        "cell_lat"
    ].dims  # e.g. ("phony_dim_0", "phony_dim_1")

    ds = ds.assign_coords(
        {
            phony_x: x_1d,
            phony_y: y_1d,
        }
    ).rename({phony_x: "x", phony_y: "y"})

    # Drop raw lat/lon — redundant now that we have x/y in meters
    ds = ds.drop_vars(["cell_lat", "cell_lon"], errors="ignore")

    # Extract time from filename; we will use this as the time dimension
    # and serialize it with pandas so it can be used in queries
    time_value = pd.Timestamp(parse_time_from_path(hd5_file_path))

    # Force explicit time dimension
    ds = ds.expand_dims(time=[time_value])
    ds = ds.sortby("time")

    # Create fsspec mapper for Zarr store
    zarr_mapper = s3_fs.get_mapper(f"{bucket}/{store_name}")

    store_exists = bool(list(zarr_mapper.keys()))

    # ensure the time dimension is encoded as microseconds
    # which keeps it consistent with other datasets in the AWO
    time_encoding = {
        "time": {
            "dtype": "int64",
            "units": "microseconds since 1970-01-01T00:00:00",
        }
    }

    if store_exists:
        ds.to_zarr(
            store=zarr_mapper,
            mode="a",
            append_dim="time",
            consolidated=True,
            zarr_format=2,
        )
    else:
        # Add CRS variable so get_crs_from_dataset can detect it automatically on the
        # query side of things
        crs = pyproj.CRS.from_epsg(6933)
        ds.attrs["proj4"] = crs.to_proj4()
        ds.to_zarr(
            store=zarr_mapper,
            mode="w",
            consolidated=True,
            zarr_format=2,
            encoding=time_encoding,
        )

    if not test_mode:
        # after appending to S3 Zarr store, remove the local file
        # so the data on disk doesn't grow indefinitely
        LOGGER.info(
            f"Removing {hd5_file_path} since it was successfully appended to S3 Zarr store"
        )
        os.remove(hd5_file_path)
