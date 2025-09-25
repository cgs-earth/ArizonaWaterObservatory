# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from NationalWaterModel.lib import fetch_data
from NationalWaterModel.nationalwatermodel_edr import NationalWaterModelEDRProvider

provider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test",
        "data": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "dataset_path": "CONUS/zarr/chrtout.zarr/",
        "x_field": "longitude",
        "y_field": "latitude",
        "time_field": "time",
    }
)


def test_provider():
    result = fetch_data(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        time_field="time",
        datetime_filter="1900-01-01",
        unopened_dataset=provider.data,
    )
    assert result.dims["feature_id"] == 0


def test_new_data():
    result = fetch_data(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        time_field="time",
        datetime_filter="2020-01-01",
        unopened_dataset=provider.data,
    )

    DAILY_OBSERVATIONS = 2_770_000
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS


def test_range_of_dates():
    result = fetch_data(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        time_field="time",
        datetime_filter="2020-01-01/2020-01-30",
        unopened_dataset=provider.data,
    )

    DAILY_OBSERVATIONS = 2_770_000
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS * 4, (
        f"not enough data in {(result.dims['feature_id'])}"
    )
