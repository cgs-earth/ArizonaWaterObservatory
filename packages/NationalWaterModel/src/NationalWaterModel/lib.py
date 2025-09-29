# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import functools
from typing import Literal, TypedDict

from com.covjson import CoverageDict
import numpy as np
from pygeoapi.provider.base import ProviderNoDataError, ProviderQueryError
import s3fs
import xarray as xr


class ProviderSchema(TypedDict):
    """
    The config used to configure the provider
    """

    type: Literal["feature", "edr"]
    data: str
    name: str
    dataset_path: str
    time_field: str
    x_field: str
    y_field: str


@functools.cache
def get_zarr_dataset_handle(endpoint_url: str, dataset_path: str) -> xr.Dataset:
    """
    Open the zarr dataset but don't actually load the data.
    We use functools cache over this since it's a slow operation
    to establish the connection with S3 and read the metadata
    """
    fs = s3fs.S3FileSystem(
        endpoint_url=endpoint_url,
        anon=True,
    )
    mapper = fs.get_mapper(dataset_path)
    return xr.open_zarr(mapper, consolidated=True, chunks="auto")


def fetch_data(
    unopened_dataset: xr.Dataset,
    select_properties: list[str],
    time_field: str,
    datetime_filter: str,
    x_field: str,
    y_field: str,
    bbox: list,
) -> xr.Dataset:
    """
    Fetch data from a remote zarr dataset. Lazily apply a
    datatime, bbox, and select properties filter to the dataset
    and only load the filtered data, not the entire dataset
    """
    assert isinstance(unopened_dataset, xr.Dataset), (
        "The dataset was not an xarray dataset"
    )
    variables_to_select = select_properties

    # if we are selecting a property, we should also select time since timeseries always needs time
    if time_field not in select_properties:
        variables_to_select.append(time_field)

    # Add x and y if not already included
    for coord in [y_field, x_field]:
        if coord not in variables_to_select:
            variables_to_select.append(coord)
    try:
        selected = unopened_dataset[variables_to_select]
    except KeyError as e:
        raise KeyError(
            f"Could not find {variables_to_select} in {unopened_dataset.variables}; resulted in error {e}"
        ) from e

    if datetime_filter is None:
        raise ProviderQueryError(
            "No datetime filter provided, fetching all data would be too large"
        )

    available_times = selected[time_field].values
    available_start = available_times.min()
    available_end = available_times.max()

    datetime_range = datetime_filter.split("/")

    if len(datetime_range) == 1:
        datetime_np = np.datetime64(datetime_filter)
        if datetime_np in available_times:
            selected = selected.sel(time=datetime_np, drop=False)
        else:
            raise ProviderNoDataError(
                f"{datetime_filter} not in available times. "
                f"Dataset time range is from {available_start} to {available_end}."
            )

    elif len(datetime_range) == 2:
        # Date range
        start, stop = datetime_range

        # Resolve open-ended ranges
        start = np.datetime64(start) if start != ".." else available_times.min()
        stop = np.datetime64(stop) if stop != ".." else available_times.max()

        # Clip start/stop to available range
        start = max(start, available_times.min())
        stop = min(stop, available_times.max())

        # Select only times that exist in the dataset
        mask = (available_times >= start) & (available_times <= stop)
        if not mask.any():
            raise ProviderNoDataError(f"No data available between {start} and {stop}.")
        else:
            times_to_select = available_times[mask]
            selected = selected.sel(time=times_to_select, drop=False)

    # Geospatial filtering using latitude and longitude variables
    lon_min, lat_min, lon_max, lat_max = bbox

    # latitude/longitude are 1D coords along "feature_id"
    lon = selected[x_field].compute()
    lat = selected[y_field].compute()

    # get only data within the bbox
    mask = (lon >= lon_min) & (lon <= lon_max) & (lat >= lat_min) & (lat <= lat_max)

    if not mask.any():
        raise ProviderNoDataError(f"No data in bbox {bbox}")

    # Use isel instead of where (avoids Dask boolean indexing issue)
    selected = selected.isel(feature_id=mask)
    return selected.load()


def dataset_to_point_covjson(
    dataset: xr.Dataset,
    x_axis: str,
    y_axis: str,
    timeseries_parameter_name: str,
    time_axis: str,
) -> dict:
    """
    Given a dataset, return a covjson point series which essentially
    represents a list of points with a timeseries line graph for eawch
    """
    x_values = dataset[x_axis].values.tolist()
    y_values = dataset[y_axis].values.tolist()

    # cast to list of ISO strings so that it is serializable into json
    time_values = (
        dataset[time_axis].values.astype("datetime64[ns]").astype(str).tolist()
    )
    timeseries_values = dataset[timeseries_parameter_name].values

    try:
        singleItem = len(dataset[time_axis].values) == 1
    except TypeError:
        singleItem = True

    # if it is a single item we have to make sure it is nested properly in a list
    if singleItem:
        time_values = [time_values]
        timeseries_values = [timeseries_values]

    coverages: list[CoverageDict] = []

    for i in range(len(x_values)):
        coverage: CoverageDict = {
            "type": "Coverage",
            "domain": {
                "type": "Domain",
                "domainType": "PointSeries",
                "axes": {
                    # The x axis is one value since it represents a point
                    "x": {"values": [x_values[i]]},
                    # The y axis is one value since it represents a point
                    "y": {"values": [y_values[i]]},
                    # The t axis is a list of times since it represents a time series
                    "t": {"values": time_values},
                },
            },
            "ranges": {
                timeseries_parameter_name: {
                    "type": "NdArray",
                    "dataType": "float",
                    "axisNames": ["t"],
                    # The shape is the length of the time series
                    # thus the number of time steps is the length of the shape
                    "shape": [len(time_values)],
                    "values": [
                        # get the timeseries value for this point at each
                        # time step. Since it is a list of lists we need to
                        # flatten
                        timeseries_arr[i]
                        for timeseries_arr in timeseries_values
                    ],
                }
            },
        }
        coverages.append(coverage)

    coverage_collection = {
        "type": "CoverageCollection",
        "parameters": {
            timeseries_parameter_name: {
                "type": "Parameter",
                "description": {"en": str(timeseries_parameter_name)},
                "unit": {"symbol": "1"},
                "observedProperty": {
                    "id": timeseries_parameter_name,
                    "label": {"en": str(timeseries_parameter_name)},
                },
            }
        },
        "referencing": [
            {
                "coordinates": ["x", "y"],
                "system": {
                    "type": "GeographicCRS",
                    "id": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                },
            },
            {
                "coordinates": ["t"],
                "system": {"type": "TemporalRS", "calendar": "Gregorian"},
            },
        ],
        "coverages": coverages,
    }

    return coverage_collection


def dataset_to_grid_covjson(
    dataset: xr.Dataset, x_axis: str, y_axis: str, z_axis: str, time_axis: str
) -> dict:
    """
    For some datasets it is possible that they return a grid
    of values instead of a point time series. i.e. for atmospheric data

    """
    raise NotImplementedError(
        "TODO if we need grid covjson representation. Unclear if we need this"
    )

    # Coordinates
    x_values = dataset[x_axis].values
    y_values = dataset[y_axis].values

    # Normalize time to list of ISO strings
    if np.issubdtype(dataset[time_axis].values.dtype, np.datetime64):
        t_values = [
            dataset[time_axis].values.astype("datetime64[ns]").astype(str).tolist()
        ]
    else:
        t_values = np.atleast_1d(dataset[time_axis].values).tolist()

    # Shape
    z_data = dataset[z_axis].values

    values_flat = z_data.flatten(order="C").tolist()

    return {
        "type": "Coverage",
        "domain": {
            "type": "Domain",
            "domainType": "Grid",
            "axes": {
                "x": {
                    "start": float(x_values.min()),
                    "stop": float(x_values.max()),
                    "num": len(x_values),
                },
                "y": {
                    "start": float(y_values.min()),
                    "stop": float(y_values.max()),
                    "num": len(y_values),
                },
                "t": {"values": t_values},
            },
            "referencing": [
                {
                    "coordinates": ["x", "y"],
                    "system": {
                        "type": "GeographicCRS",
                        "id": "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                    },
                },
                {
                    "coordinates": ["t"],
                    "system": {"type": "TemporalRS", "calendar": "Gregorian"},
                },
            ],
        },
        "parameters": {
            z_axis: {
                "type": "Parameter",
                "description": {"en": str(z_axis)},
                "unit": {"symbol": "1"},
                "observedProperty": {"id": z_axis, "label": {"en": str(z_axis)}},
            }
        },
        "ranges": {
            z_axis: {
                "type": "NdArray",
                "dataType": "float",
                "axisNames": ["t", "y", "x"],
                "shape": [
                    len(t_values),
                    len(y_values),
                    len(x_values),
                ],
                # "values": [40] * (len(values_flat) * len(t_values) * len(y_values)),
                "values": values_flat,
            }
        },
    }
