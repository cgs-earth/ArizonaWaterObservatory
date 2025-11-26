# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

### This is a Jupyter notebook in Python format so that it can
### be ran easily from the command line
###

# %%
import gcsfs
import geopandas as gpd
import numpy as np
import s3fs
import shapely.wkb
import xarray as xr

# %%
# Load GeoParquet
gdf = gpd.read_parquet("NHDPlusV21_CatchmentSP.parquet")

# Load US states boundaries from remote GeoJSON
arizona = gpd.read_file(
    "https://reference.geoconnex.us/collections/states/items/04?f=json"
)

assert arizona.crs
# Ensure CRS matches
gdf = gdf.to_crs(arizona.crs)

# Filter points/locations within Arizona
gdf_arizona = gdf[gdf.within(arizona.unary_union)]

output_file = "locations_arizona.parquet"

# Save filtered GeoParquet
gdf_arizona.to_parquet(output_file)

print(f"Filtered {len(gdf_arizona)} locations in Arizona.")
print(gdf_arizona.head())

# %%
# connect to the NWM zarr
remote_dataset = "CONUS/zarr/gwout.zarr/"
fs_s3 = s3fs.S3FileSystem(
    anon=True,
    endpoint_url="https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
)
mapper = fs_s3.get_mapper(remote_dataset)

# Lazy load dataset
zarr_dataset = xr.open_zarr(mapper, consolidated=True, chunks="auto")
print(zarr_dataset)

# %%
mask = np.isin(
    zarr_dataset["feature_id"].values, gdf_arizona["OBJECTID"].values
)

# Select only matching features
zarr_dataset_filtered = zarr_dataset.sel({"feature_id": mask})
print(zarr_dataset_filtered)

# %%
assert "FEATUREID" in gdf_arizona.columns
gdf_arizona["FEATUREID"].values, gdf_arizona.head()

# %%
# Align geometries with filtered dataset
hasMatch = {}

for fid in zarr_dataset_filtered["feature_id"].values:
    if fid in gdf_arizona["OBJECTID"].values:
        hasMatch[fid] = True

print(len(hasMatch), list(hasMatch.keys())[:5])

# %%
# Map OBJECTID → geometry (Shapely)
geom_lookup = dict(
    zip(gdf_arizona["OBJECTID"], gdf_arizona["Shape"], strict=False)
)

# Build WKB array matching filtered feature_id order
geometries_wkb = np.array(
    [
        shapely.wkb.dumps(geom_lookup[fid])
        for fid in zarr_dataset_filtered["feature_id"].values
    ],
    dtype=object,
)
geometries_wkb = geometries_wkb.astype("S")  # convert to bytes dtype

print(geometries_wkb)

# %%
zarr_dataset_with_geom = zarr_dataset_filtered.assign_coords(
    geometry_wkb=("feature_id", geometries_wkb)
)
print(zarr_dataset_with_geom)

# %%
gcs_fs = gcsfs.GCSFileSystem(token="asu-awo-account.json")

gcs_path = "asu-awo-data/filtered_gwout_with_geometry.zarr"

# %%
print("Writing dataset to GCS...")
zarr_dataset_with_geom.to_zarr(
    store=gcs_fs.get_mapper(gcs_path), mode="w", consolidated=True
)
print(f"Dataset written to gs://{gcs_path}")
