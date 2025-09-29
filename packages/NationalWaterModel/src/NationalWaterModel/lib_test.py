# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pygeoapi.provider.base import ProviderNoDataError
import pytest

from NationalWaterModel.lib import fetch_data
from NationalWaterModel.nationalwatermodel_edr import NationalWaterModelEDRProvider

provider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test",
        "remote_base_url": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "remote_dataset": "CONUS/zarr/chrtout.zarr/",
        "x_field": "longitude",
        "y_field": "latitude",
        "time_field": "time",
    }
)

ARIZONA_BBOX = [-112.5, 31.7, -110.7, 33.0]


def test_provider_no_data():
    with pytest.raises(ProviderNoDataError):
        fetch_data(
            bbox=ARIZONA_BBOX,
            select_properties=["streamflow"],
            time_field="time",
            x_field="longitude",
            y_field="latitude",
            datetime_filter="1900-01-01",
            unopened_dataset=provider.zarr_dataset,
        )


def test_new_data():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        select_properties=["streamflow"],
        time_field="time",
        datetime_filter="2023-01-01",
        x_field="longitude",
        y_field="latitude",
        unopened_dataset=provider.zarr_dataset,
    )

    DAILY_OBSERVATIONS = 5200
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS


def test_range_of_dates():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        select_properties=["streamflow"],
        time_field="time",
        x_field="longitude",
        y_field="latitude",
        datetime_filter="2020-01-01/2020-01-02",
        unopened_dataset=provider.zarr_dataset,
    )

    DAILY_OBSERVATIONS = 5200
    assert result.dims["feature_id"] >= DAILY_OBSERVATIONS, (
        f"each dimension should have at least {DAILY_OBSERVATIONS} observations"
    )
    assert result.dims["time"] >= 23 and result.dims["time"] <= 26, (
        "There should be around 24 two hour timesteps to cover the entire two days, (plus or minus a few intervals to allow for rounding)"
    )


def test_no_parameters():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        select_properties=[],
        time_field="time",
        x_field="longitude",
        y_field="latitude",
        datetime_filter="2020-01-01",
        unopened_dataset=provider.zarr_dataset,
    )
    assert len(result.data_vars.items()) == 0
