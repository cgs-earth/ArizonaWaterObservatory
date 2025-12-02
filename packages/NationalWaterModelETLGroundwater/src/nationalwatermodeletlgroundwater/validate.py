# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

# %%

"""
Validate that our zarr dataset is
present and readable from GCS
"""

import time

import gcsfs
import xarray

# %%
start = time.time()
gcs_fs = gcsfs.GCSFileSystem(
    project="asu-awo",
    secure_serialize=False,
    anon=True,
    token="anon",
    requester_pays=False,
)
end = time.time()
print(end - start)


# %%
gcs_path = "asu-awo-data/filtered_gwout_with_geometry.zarr"

zarr_dataset = xarray.open_zarr(
    store=gcs_fs.get_mapper(gcs_path),
    consolidated=True,
    zarr_format=2,
    chunks="auto",
)

# %%
assert zarr_dataset
print(zarr_dataset)
print(zarr_dataset["feature_id"].shape, zarr_dataset["time"].shape)
# %%
