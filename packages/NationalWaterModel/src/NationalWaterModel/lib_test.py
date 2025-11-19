# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from pygeoapi.crs import DEFAULT_CRS
from pygeoapi.provider.base import ProviderNoDataError, ProviderQueryError
from pygeoapi.util import transform_bbox
import pyproj
import pytest

from NationalWaterModel.lib import fetch_data, project_dataset
from NationalWaterModel.nationalwatermodel_edr import (
    NationalWaterModelEDRProvider,
)

from .lib import get_crs_from_dataset

provider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test",
        "data": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "remote_dataset": "CONUS/zarr/chrtout.zarr/",
        "x_field": "longitude",
        "y_field": "latitude",
        "time_field": "time",
        "raster": False,
    }
)

route_to_route_provider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test_route_to_route",
        "data": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "remote_dataset": "CONUS/zarr/rtout.zarr",
        "x_field": "x",
        "y_field": "y",
        "time_field": "time",
        "raster": True,
    }
)

ARIZONA_BBOX = [-112.5, 31.7, -110.7, 33.0]


def test_provider_no_data():
    with pytest.raises(ProviderNoDataError):
        fetch_data(
            bbox=ARIZONA_BBOX,
            timeseries_properties_to_fetch=["streamflow"],
            time_field="time",
            x_field="longitude",
            y_field="latitude",
            datetime_filter="1900-01-01",
            unopened_dataset=provider.zarr_dataset,
        )


def test_provider_invalid_date_range():
    with pytest.raises(ProviderQueryError):
        fetch_data(
            bbox=ARIZONA_BBOX,
            timeseries_properties_to_fetch=["streamflow"],
            time_field="time",
            x_field="longitude",
            y_field="latitude",
            datetime_filter="2000-01-01/1900-01-01",
            unopened_dataset=provider.zarr_dataset,
        )


def test_new_data():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        timeseries_properties_to_fetch=["streamflow"],
        time_field="time",
        datetime_filter="2023-01-01",
        x_field="longitude",
        y_field="latitude",
        unopened_dataset=provider.zarr_dataset,
    )

    assert result.dims["feature_id"] >= 10, (
        "there should be at least 10 features"
    )


def test_range_of_dates():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        timeseries_properties_to_fetch=["streamflow"],
        time_field="time",
        x_field="longitude",
        y_field="latitude",
        datetime_filter="2020-01-01/2020-01-02",
        unopened_dataset=provider.zarr_dataset,
    )

    NUM_FEATURES = 10
    assert result.dims["feature_id"] >= NUM_FEATURES, (
        f"each dimension should have at least {NUM_FEATURES} features"
    )
    assert result.dims["time"] >= 23 and result.dims["time"] <= 26, (
        "There should be around 24 two hour timesteps to cover the entire two days, (plus or minus a few intervals to allow for rounding)"
    )


def test_no_parameters():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        timeseries_properties_to_fetch=[],
        time_field="time",
        x_field="longitude",
        y_field="latitude",
        datetime_filter="2020-01-01",
        unopened_dataset=provider.zarr_dataset,
    )
    assert len(result.data_vars.items()) == 0


def test_crs():
    crs = get_crs_from_dataset(provider.zarr_dataset)

    projected_dataset = project_dataset(
        provider.zarr_dataset,
        crs,
        pyproj.CRS.from_epsg(3857),
        "longitude",
        "latitude",
        raster=False,
    )

    assert (
        projected_dataset["longitude"].values[0]
        != provider.zarr_dataset["longitude"].values[0]
    )


def test_limit():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        timeseries_properties_to_fetch=["streamflow"],
        time_field="time",
        datetime_filter="2023-01-01",
        x_field="longitude",
        y_field="latitude",
        unopened_dataset=provider.zarr_dataset,
        feature_limit=10,
    )

    assert result.sizes["feature_id"] == 10
    assert result["feature_id"].values[-1].tolist() == 15840270


def test_limit_with_offset():
    result = fetch_data(
        bbox=ARIZONA_BBOX,
        timeseries_properties_to_fetch=["streamflow"],
        time_field="time",
        datetime_filter="2023-01-01",
        x_field="longitude",
        y_field="latitude",
        unopened_dataset=provider.zarr_dataset,
        feature_limit=1,
        feature_offset=9,
    )

    assert result.sizes["feature_id"] == 1
    assert result["feature_id"].values[0].tolist() == 15840270


def test_raster_with_range():
    # Roughly equivalent to the following
    # http://localhost:5005/collections/National_Water_Data_Reach_to_Reach_Routing_Output/cube?parameter-name=sfcheadsubrt&bbox=-112.5,31.7,-111.7,32.0&datetime=2020-01-01/2020-01-02&f=json
    small_arizona_bbox = [-112.5, 31.7, -111.7, 32.0]
    crs = get_crs_from_dataset(route_to_route_provider.zarr_dataset)
    result = fetch_data(
        bbox=transform_bbox(small_arizona_bbox, DEFAULT_CRS, crs),
        timeseries_properties_to_fetch=["sfcheadsubrt"],
        time_field="time",
        datetime_filter="2020-01-01/2020-01-02",
        x_field="x",
        y_field="y",
        unopened_dataset=route_to_route_provider.zarr_dataset,
        raster=True,
    )
    assert result
    assert result.variables["sfcheadsubrt"].shape
    assert len(result.coords["time"]) >= 1
