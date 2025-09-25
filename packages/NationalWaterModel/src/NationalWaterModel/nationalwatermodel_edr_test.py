# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from .nationalwatermodel_edr import NationalWaterModelEDRProvider

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
    result = provider.cube(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        datetime_="1900-01-01",
    )
    assert result.dims["feature_id"] == 0


def test_new_data():
    result = provider.cube(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        datetime_="2020-01-01",
    )
    DAILY_OBSERVATIONS = 2_770_000
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS


def test_more_recent_data():
    result = provider.cube(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        datetime_="2020-01-10",
    )
    DAILY_OBSERVATIONS = 2_770_000
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS


def test_date_range():
    result = provider.cube(
        bbox=[-170, 15, -51, 72],
        select_properties=["streamflow"],
        datetime_="2020-01-01/2020-01-10",
    )
    DAILY_OBSERVATIONS = 2_770_000
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS * 9
