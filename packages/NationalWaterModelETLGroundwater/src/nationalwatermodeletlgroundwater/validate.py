# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# %%

"""
Validate that our zarr dataset is
present and readable from GCS
"""

import gcsfs
import s3fs
import xarray

# %%

gcs_fs = gcsfs.GCSFileSystem(project="asu-awo")

gcs_path = "asu-awo-data/filtered_gwout_with_geometry.zarr"


zarr_dataset = xarray.open_zarr(
    store=gcs_fs.get_mapper(gcs_path),
    consolidated=True,
    chunks="auto",
)
assert zarr_dataset
print(zarr_dataset)
# %%

s3_fs = s3fs.S3FileSystem()
s3_path = "https://storage.googleapis.com/asu-awo-data/filtered_gwout_with_geometry.zarr"

zarr_dataset = xarray.open_zarr(
    store=s3_fs.get_mapper(s3_path),
    consolidated=True,
    chunks="auto",
)
assert zarr_dataset
print(zarr_dataset)

# %%
