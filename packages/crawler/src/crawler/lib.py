# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pathlib import Path
import re

import geopandas as gpd
import pandas as pd
import xarray as xr


def get_adwr_link(data_to_parse):
    regex = r"""<a[^>]+href="([^"]+)"[^>]*>Groundwater Site Inventory<\/a>"""
    result = re.search(regex, data_to_parse)
    if result is None:
        raise RuntimeError("Unable to find link")
    return result.group(1)


def xlsx_to_xarray(xlsx_file: Path) -> xr.Dataset:
    """
    Read an Excel file into an xarray.Dataset, automatically promoting
    the first column as a dimension and any datetime-like column
    (e.g., 'date', 'time', etc.) to be the secondary dimension.

    This ensures that when exporting to Zarr, the datetime field is
    stored as a proper dimension/coordinate rather than a data variable.
    """
    df = pd.read_excel(xlsx_file)

    if df.empty:
        raise ValueError(f"No data found in Excel file: {xlsx_file}")

    # Identify datetime-like columns
    datetime_cols = [
        col
        for col in df.columns
        if pd.api.types.is_datetime64_any_dtype(df[col])
        or "date" in col.lower()
        or "time" in col.lower()
    ]

    # Convert datetime-like columns
    for col in datetime_cols:
        df[col] = pd.to_datetime(df[col], errors="coerce")

    # Determine the primary (non-datetime) and secondary (datetime) index columns
    primary_col = df.columns[0]  # first column in Excel
    secondary_col = datetime_cols[0] if datetime_cols else None

    # Set the index
    if secondary_col:
        # add obs to separate duplicate measurements
        df["obs"] = df.groupby([primary_col, secondary_col]).cumcount()
        df = df.set_index([primary_col, secondary_col, "obs"])
    else:
        df["obs"] = df.groupby([primary_col]).cumcount()
        df = df.set_index([primary_col, "obs"])

    # Convert to xarray.Dataset
    ds = xr.Dataset.from_dataframe(df)

    return ds


def upload_dataset_to_s3(
    ds: xr.Dataset,
    zarr_path: str,
    access_key: str,
    secret_key: str,
    endpoint_url: str,
):
    return ds.to_zarr(
        zarr_path,
        storage_options={
            "key": access_key,
            "secret": secret_key,
            "client_kwargs": {"endpoint_url": endpoint_url},
        },  # pyright: ignore[reportArgumentType]
        mode="w",
        zarr_format=2,
        consolidated=True,
    )


def upload_xlsx_to_s3(
    local_xlsx_path: Path,
    bucket: str,
    access_key: str,
    secret_key: str,
    endpoint_url: str,
):
    # Read Excel → DataFrame → Dataset
    df = pd.read_excel(local_xlsx_path)
    ds = xr.Dataset.from_dataframe(df)

    # Save as Zarr directly to S3
    zarr_path = (
        f"s3://{bucket}/{local_xlsx_path.name.removesuffix('.xlsx')}.zarr"
    )
    return upload_dataset_to_s3(
        ds,
        zarr_path,
        access_key,
        secret_key,
        endpoint_url,
    )


def add_shapefile_info_to_dataset(
    shapefile_path: Path, dataset: xr.Dataset, fileName: str
):
    gdf = gpd.read_file(shapefile_path)

    # Ensure IDs are strings for reliable joining
    gdf["SITE_ID"] = gdf["SITE_ID"].astype(str)
    gdf = gdf.drop_duplicates(subset="SITE_ID")

    # Extract x/y coordinates from geometry
    if "geometry" in gdf.columns:
        gdf["geometry_x"] = gdf.geometry.x
        gdf["geometry_y"] = gdf.geometry.y

    firstColumnName = list(dataset.variables.keys())[0]
    ids = dataset[firstColumnName].astype(str).values
    idToJoinAgainst = firstColumnName

    # Convert dataset IDs to DataFrame for joining
    ds_df = pd.DataFrame({idToJoinAgainst: ids})

    # Merge GeoDataFrame info into this DataFrame
    merged = ds_df.merge(
        gdf, left_on=idToJoinAgainst, right_on="SITE_ID", how="left"
    )

    # Add selected geospatial fields to dataset
    for col in [
        "DD_LAT",
        "DD_LONG",
        "geometry_x",
        "geometry_y",
        "WELL_ALT",
        "WELL_TYPE",
        "WELL_DEPTH",
    ]:
        if col in merged.columns:
            dim_name = list(dataset.dims.keys())[0]
            dataset[col] = ((dim_name,), merged[col].values)

    return dataset
