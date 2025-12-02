# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# %%

"""
Add geometry then upload
the zarr dataset to GCS
"""

from pathlib import Path

import gcsfs
import geopandas as gpd
import numpy as np
import s3fs
from shapely import wkb
import xarray as xr

az = Path(__file__).parent / "locations_arizona.parquet"

gdf_arizona = gpd.read_parquet(az)


zarr_dataset_filtered = xr.open_zarr(
    store=Path(__file__).parent / "zarr_dataset",
    zarr_format=2,
    consolidated=False,
)

print(zarr_dataset_filtered)

# %%

# Map OBJECTID → geometry (Shapely)
geom_lookup = dict(
    zip(gdf_arizona["OBJECTID"], gdf_arizona["Shape"], strict=False)
)

# Build WKB array matching filtered feature_id order
geometries_wkb = np.array(
    [
        wkb.dumps(geom_lookup[fid])
        for fid in zarr_dataset_filtered["feature_id"].values
    ],
    dtype=object,
)
# geometries_wkb = geometries_wkb.astype("S")  # convert to bytes dtype

assert geometries_wkb.shape == zarr_dataset_filtered["feature_id"].shape

# %%
# Convert Shapely polygon → WKB bytes and compute centroid lat/lon

# 1. Build arrays for WKB, centroid lat, centroid lon
geometries_wkb = []
centroid_lat = []
centroid_lon = []

for fid in zarr_dataset_filtered["feature_id"].values:
    geom = geom_lookup[fid]  # shapely geometry
    wkb_bytes = wkb.dumps(geom)  # raw bytes
    geometries_wkb.append(wkb_bytes)

    c = geom.centroid
    assert c
    assert c.x
    assert c.y
    centroid_lat.append(c.y)
    centroid_lon.append(c.x)

geometries_wkb = np.array(geometries_wkb, dtype=object)
centroid_lat = np.array(centroid_lat, dtype="float64")
centroid_lon = np.array(centroid_lon, dtype="float64")

assert geometries_wkb.shape == zarr_dataset_filtered["feature_id"].shape

# 2. Attach to dataset as new variables
zarr_dataset_filtered = zarr_dataset_filtered.assign(
    geometry_wkb=("feature_id", geometries_wkb),
    centroid_lat=("feature_id", centroid_lat),
    centroid_lon=("feature_id", centroid_lon),
)

# %%

#### Apply chunking to match the national water model
#### This makes it so it has the same chunking / load
#### performance as the original dataset

remote_dataset = "CONUS/zarr/gwout.zarr/"
fs_s3 = s3fs.S3FileSystem(
    anon=True,
    endpoint_url="https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
)
mapper = fs_s3.get_mapper(remote_dataset)

# Lazy load dataset
zarr_dataset = xr.open_zarr(mapper, chunks="auto")
feature_chunk = zarr_dataset["feature_id"].encoding["chunks"]
time_chunk = zarr_dataset["time"].encoding["chunks"]

# NWM chunk sizes:
assert time_chunk == 672
assert feature_chunk == 30000

# Apply chunking to 2-D variables
zarr_dataset_filtered = zarr_dataset_filtered.chunk(
    {
        "time": time_chunk,
        "feature_id": feature_chunk,
    }
)

# Apply full-length chunking for 1-D per-feature variables
full_feature_chunk = (zarr_dataset_filtered.sizes["feature_id"],)

for v in ["feature_id", "geometry_wkb", "centroid_lat", "centroid_lon"]:
    if v in zarr_dataset_filtered:
        zarr_dataset_filtered[v].encoding["chunks"] = full_feature_chunk

# %%

gcs_fs = gcsfs.GCSFileSystem()

gcs_path = "asu-awo-data/filtered_gwout_with_geometry.zarr"
print("Writing dataset to GCS...")
zarr_dataset_filtered.to_zarr(
    store=gcs_fs.get_mapper(gcs_path),
    mode="w",
    consolidated=True,
    zarr_format=2,
)
print(f"Dataset written to gs://{gcs_path}")
