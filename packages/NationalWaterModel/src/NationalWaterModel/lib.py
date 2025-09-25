# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import numpy as np
from pygeoapi.provider.base import ProviderNoDataError
import xarray as xr


def fetch_data(
    unopened_dataset: xr.Dataset,
    select_properties: list[str],
    time_field: str,
    datetime_filter: str,
    bbox: list,
) -> xr.Dataset:
    variables_to_select = select_properties

    if time_field not in select_properties:
        variables_to_select.append(time_field)

    # Add latitude/longitude if not already included
    for coord in ["latitude", "longitude"]:
        if coord not in variables_to_select:
            variables_to_select.append(coord)

    selected = unopened_dataset[variables_to_select]

    if datetime_filter is not None:
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
                raise ProviderNoDataError(
                    f"No data available between {start} and {stop}."
                )
            else:
                times_to_select = available_times[mask]
                selected = selected.sel(time=times_to_select, drop=False)
    else:
        # Pick latest time index
        latest_time_index = selected[time_field].size - 1
        selected = selected.isel({time_field: latest_time_index})

    # Geospatial filtering using latitude and longitude variables
    lon_min, lat_min, lon_max, lat_max = bbox

    # latitude/longitude are 1D coords along "feature_id"
    lon = selected.longitude.compute()
    lat = selected.latitude.compute()

    mask = (lon >= lon_min) & (lon <= lon_max) & (lat >= lat_min) & (lat <= lat_max)

    if not mask.any():
        raise ProviderNoDataError(f"No data in bbox {bbox}")

    # Use isel instead of where (avoids Dask boolean indexing issue)
    selected = selected.isel(feature_id=mask)
    return selected.load()


def dataset_to_point_covjson(
    dataset: xr.Dataset, x_axis: str, y_axis: str, z_axis: str, time_axis: str
) -> dict:
    x_values = dataset[x_axis].values.tolist()
    y_values = dataset[y_axis].values.tolist()
    z_values = dataset[z_axis].values.tolist()

    assert len(x_values) == len(y_values) == len(z_values)

    # Normalize time to list of ISO strings
    if np.issubdtype(dataset[time_axis].values.dtype, np.datetime64):
        t_values = [
            dataset[time_axis].values.astype("datetime64[ns]").astype(str).tolist()
        ]
    else:
        t_values = np.atleast_1d(dataset[time_axis].values).tolist()

    coverages = []
    for i in range(len(x_values)):
        coverage = {
            "type": "Coverage",
            "domain": {
                "type": "Domain",
                "axes": {
                    "x": {"values": [x_values[i]]},
                    "y": {"values": [y_values[i]]},
                    "t": {"values": t_values},
                },
            },
            "ranges": {
                z_axis: {
                    "type": "NdArray",
                    "dataType": "float",
                    "values": [z_values[i]],
                }
            },
        }
        coverages.append(coverage)

    coverage_collection = {
        "type": "CoverageCollection",
        "domainType": "Point",
        "parameters": {
            z_axis: {
                "type": "Parameter",
                "description": {"en": str(z_axis)},
                "unit": {"symbol": "1"},
                "observedProperty": {"id": z_axis, "label": {"en": str(z_axis)}},
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
    """ " """
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
