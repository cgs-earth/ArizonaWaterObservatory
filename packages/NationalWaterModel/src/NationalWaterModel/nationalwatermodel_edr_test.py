# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

from .nationalwatermodel_edr import NationalWaterModelEDRProvider

channelRoutingOutProvider = NationalWaterModelEDRProvider(
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

lakeOutProvider = NationalWaterModelEDRProvider(
    provider_def={
        "type": "edr",
        "name": "test",
        "data": "https://noaa-nwm-retrospective-3-0-pds.s3.amazonaws.com",
        "remote_dataset": "CONUS/zarr/lakeout.zarr/",
        "x_field": "longitude",
        "y_field": "latitude",
        "time_field": "time",
        "raster": False,
    }
)


def test_nationalwater_model_multi_pointseries():
    # http://localhost:5005/collections/National_Water_Model_Channel_Routing_Output/cube?bbox=-112.5,31.7,-111.7,31.9&f=html&parameter-name=velocity&datetime=2023-01-01/2023-01-02
    fields = channelRoutingOutProvider.get_fields()
    assert "velocity" in fields
    res = channelRoutingOutProvider.cube(
        bbox=[-112.5, 31.7, -111.7, 31.9],
        select_properties=["velocity"],
        datetime_="2023-01-01/2023-01-02",
    )
    assert isinstance(res, dict) and "coverages" in res
    numCoverages = len(res["coverages"])
    assert numCoverages >= 2, (
        f"Expected at least 2 coverages, got {numCoverages}"
    )


def test_nationalwater_model_multi_pointseries_single_datetime():
    # http://localhost:5005/collections/National_Water_Model_Channel_Routing_Output/cube?bbox=-112.5,31.7,-111.7,31.9&f=html&parameter-name=velocity&datetime=2023-01-01
    fields = channelRoutingOutProvider.get_fields()
    assert "velocity" in fields
    res = channelRoutingOutProvider.cube(
        bbox=[-112.5, 31.7, -111.7, 31.9],
        select_properties=["velocity"],
        datetime_="2023-01-01",
    )
    assert isinstance(res, dict) and "coverages" in res
    numCoverages = len(res["coverages"])
    assert numCoverages >= 2, (
        f"Expected at least 2 coverages, got {numCoverages}"
    )


def test_national_water_model_multipointseries_datetime_range_and_single_point():
    # http://localhost:5005/collections/National_Water_Model_Lakeout/locations/22443762?parameter-name=inflow&datetime=2023-01-24%2F2023-01-31
    fields = lakeOutProvider.get_fields()
    assert "inflow" in fields
    res = lakeOutProvider.locations(
        location_id="22443762",
        select_properties=["inflow"],
        datetime_="2023-01-24/2023-01-31",
    )
    assert isinstance(res, dict) and "coverages" in res
    numCoverages = len(res["coverages"])
    assert numCoverages == 1, f"Expected 1 coverage, got {numCoverages}"


def test_national_water_model_multipointseries_single_datetime_and_single_point():
    # http://localhost:5005/collections/National_Water_Model_Lakeout/locations/22443762?parameter-name=inflow&datetime=2023-01-24
    fields = lakeOutProvider.get_fields()
    assert "inflow" in fields
    res = lakeOutProvider.locations(
        location_id="22443762",
        select_properties=["inflow"],
        datetime_="2023-01-24",
    )
    assert isinstance(res, dict) and "coverages" in res
    numCoverages = len(res["coverages"])
    assert numCoverages == 1, f"Expected 1 coverage, got {numCoverages}"


def test_elevation_coord_isnt_queryable():
    fields = channelRoutingOutProvider.get_fields()
    assert "elevation" not in fields
