# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

### This is a Jupyter notebook in Python format so that it can
### be ran easily from the command line
###

# %%
from pathlib import Path

import geopandas as gpd
import numcodecs  # noqa: F401
import numpy as np
import s3fs
import xarray as xr
import zarr
import zarr.storage

# %%
# Load GeoParquet
parquet_file = Path(__file__).parent / "NHDPlusV21_CatchmentSP.parquet"
gdf = gpd.read_parquet(parquet_file)

# Load US states boundaries from remote GeoJSON
arizona = gpd.read_file(
    "https://reference.geoconnex.us/collections/states/items/04?f=json"
)

assert arizona.crs
# Ensure CRS matches
gdf = gdf.to_crs(arizona.crs)

# Filter points/locations within Arizona
gdf_arizona = gdf[gdf.within(arizona.unary_union)]

output_file = Path(__file__).parent / "locations_arizona.parquet"

# Save filtered GeoParquet
gdf_arizona.to_parquet(output_file)

print(f"Filtered {len(gdf_arizona)} locations in Arizona.")
print(gdf_arizona.head())

# %%
# connect to the NWM zarr; this groundwater data
# notably does not include any geometry so it must
# be joined in
remote_dataset = "CONUS/zarr/gwout.zarr/"
fs_s3 = s3fs.S3FileSystem(
    anon=True,
    endpoint_url="https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
)
mapper = fs_s3.get_mapper(remote_dataset)

# Lazy load dataset
zarr_dataset = xr.open_zarr(mapper, chunks="auto")
print(zarr_dataset)

# %%
mask = np.isin(
    zarr_dataset["feature_id"].values,
    gdf_arizona["OBJECTID"].values,  # type: ignore
)

# Select only matching features
print("Loading dataset")
zarr_dataset_filtered = zarr_dataset.sel({"feature_id": mask})
print("Loaded filtered dataset")
print(zarr_dataset_filtered)

# %%
assert "FEATUREID" in gdf_arizona.columns
print(gdf_arizona["FEATUREID"].values, gdf_arizona.head())  # type: ignore

# %%
# Align geometries with filtered dataset
hasMatch = {}

for fid in zarr_dataset_filtered["feature_id"].values:
    if fid in gdf_arizona["OBJECTID"].values:  # type: ignore
        hasMatch[fid] = True

print(len(hasMatch), list(hasMatch.keys())[:5])

# %%
# zip files only append; they don't overwrite so remove if exists
local_path = Path(__file__).parent / "zarr_dataset"
print("Writing dataset to local filesystem...")
# Write directly using path string
# for some reason can't use zip store since there is a chunking issue with it
store = zarr.storage.LocalStore(str(local_path))
zarr_dataset_filtered.to_zarr(
    store=store,
    mode="w",
    consolidated=False,
    zarr_format=2,
)
