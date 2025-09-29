# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from .nationalwatermodel_edr import NationalWaterModelEDRProvider

provider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test",
        "data": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "remote_dataset": "CONUS/zarr/chrtout.zarr/",
        "x_field": "longitude",
        "y_field": "latitude",
        "time_field": "time",
    }
)
