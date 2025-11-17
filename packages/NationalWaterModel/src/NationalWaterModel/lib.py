# Copyright 2025 Lincoln Institute of Land Policy
# SPDX-License-Identifier: Apache-2.0

import functools
import logging
from typing import Literal, NotRequired, TypedDict

from com.covjson import CoverageCollectionDict, CoverageDict
import numpy as np
from pygeoapi.api import DEFAULT_STORAGE_CRS
from pygeoapi.provider.base import (
    ProviderInvalidDataError,
    ProviderNoDataError,
    ProviderQueryError,
)
from pygeoapi.util import get_crs_from_uri
import pyproj
import s3fs
import xarray as xr


class ProviderSchema(TypedDict):
    """
    The config used to configure the provider
    """

    # The type of provider
    type: Literal["feature", "edr"]
    # The url or path to the dataset
    data: str
    # If the dataset is remote, the subpath from the root url to the dataset
    remote_dataset: NotRequired[str]
    # The name of the provider
    name: str
    # The field used to represent time in the dataset
    time_field: str
    # The field used to represent x in the dataset
    x_field: str
    # The field used to represent y in the dataset
    y_field: str
    # Whether the dataset is a raster image. If not, it is a vector and
    # we will try to represent it as points in covjson
    raster: bool
    # The crs of the dataset that was ingested
    storage_crs_override: NotRequired[str]
    # The crs of the dataset that should be output in covjson
    output_crs: NotRequired[str]


LOGGER = logging.getLogger(__name__)


@functools.cache
def get_zarr_dataset_handle(
    data: str, remote_dataset: str | None
) -> xr.Dataset:
    """
    Open the zarr dataset but don't actually load the data.
    We use functools cache over this since it's a slow operation
    either to open a large file or establish the connection with S3 and read the metadata
    """
    if not remote_dataset:
        try:
            LOGGER.debug(f"Opening local zarr dataset {data}")
            return xr.open_zarr(data, consolidated=True, chunks="auto")
        except Exception as e:
            raise ProviderNoDataError(f"Failed to open {data}, {e}") from e

    fs = s3fs.S3FileSystem(
        endpoint_url=data,
        anon=True,
    )
    mapper = fs.get_mapper(remote_dataset)
    return xr.open_zarr(mapper, consolidated=True, chunks="auto")


def get_crs_from_dataset(dataset: xr.Dataset) -> pyproj.CRS:
    for var in dataset.variables:
        if str(var).lower() == "crs":
            spatial_ref = dataset[var].attrs["spatial_ref"]
            try:
                return pyproj.CRS.from_wkt(spatial_ref)
            except Exception as e:
                raise ProviderInvalidDataError(
                    f"Failed to parse storage crs: {spatial_ref}"
                ) from e

    try:
        return pyproj.CRS.from_json_dict(dataset.attrs)
    except Exception:
        LOGGER.warning("Could not find storage crs in attr dict")

    for var in dataset.attrs:
        if str(var).lower() == "proj4":
            spatial_ref = dataset.attrs[var]
            try:
                return pyproj.CRS.from_proj4(spatial_ref)
            except Exception as e:
                raise ProviderInvalidDataError(
                    f"Failed to parse storage crs: {spatial_ref}"
                ) from e

    return get_crs_from_uri(DEFAULT_STORAGE_CRS)


def project_dataset(
    dataset: xr.Dataset,
    storage_crs: pyproj.CRS,
    output_crs: pyproj.CRS,
    x_field: str | None,
    y_field: str | None,
    raster: bool = False,
) -> xr.Dataset:
    if storage_crs == output_crs:
        return dataset

    transformer = pyproj.Transformer.from_crs(
        storage_crs, output_crs, always_xy=True
    )

    if not raster:
        # Point dataset: simple 1D projection
        x_proj, y_proj = transformer.transform(
            dataset[x_field].values, dataset[y_field].values
        )
        return dataset.assign_coords({x_field: x_proj, y_field: y_proj})

    else:
        # if the dataset is raster we need to reproject it. raster datasets
        # a non linear crs are non trivial to reproject so it is easiest to just
        # use rio.reproject
        dataset = dataset.rio.set_spatial_dims(x_dim=x_field, y_dim=y_field)
        dataset = dataset.rio.write_crs(storage_crs.to_wkt())
        return dataset.rio.reproject(dst_crs=output_crs.to_wkt())


def fetch_data(
    unopened_dataset: xr.Dataset,
    timeseries_properties_to_fetch: list[str],
    time_field: str | None,
    datetime_filter: str | None,
    x_field: str | None,
    y_field: str | None,
    bbox: list,
    feature_id: str | None = None,
    feature_limit: int | None = None,
    feature_offset: int | None = None,
    raster: bool = False,
) -> xr.Dataset:
    """
    Fetch data from a remote zarr dataset. Lazily apply a
    datetime, bbox, and select properties filter to the dataset
    and only load the filtered data, not the entire dataset.

    Optionally, limit the number of features returned.
    """
    assert isinstance(unopened_dataset, xr.Dataset), (
        "The dataset was not an xarray dataset"
    )
    variables_to_select = timeseries_properties_to_fetch.copy()

    # if we are selecting a property, we should also select time since timeseries always needs time
    if time_field and time_field not in variables_to_select:
        variables_to_select.append(time_field)

    # Add x and y if not already included
    for coord in [y_field, x_field]:
        if coord and coord not in variables_to_select:
            variables_to_select.append(coord)

    try:
        selected = unopened_dataset[variables_to_select]
    except KeyError as e:
        raise KeyError(
            f"Could not find {variables_to_select} in {unopened_dataset.variables}; resulted in error {e}"
        ) from e

    if feature_id is not None:
        selected = selected.sel(feature_id=int(feature_id))
        return selected.load()

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
        start = (
            np.datetime64(start) if start != ".." else available_times.min()
        )
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

    if bbox:
        # Geospatial filtering using latitude and longitude variables
        lon_min, lat_min, lon_max, lat_max = bbox

        # latitude/longitude are 1D coords along "feature_id"
        lon = selected[x_field].compute()
        lat = selected[y_field].compute()

        # get only data within the bbox
        mask = (
            (lon >= lon_min)
            & (lon <= lon_max)
            & (lat >= lat_min)
            & (lat <= lat_max)
        )

        if not mask.any():
            raise ProviderNoDataError(f"No data in bbox {bbox}")

        if raster:
            # if it is raster there is no feature_id
            # and thus the mask needs to be applied to the dataset as a whole
            selected = selected.where(mask, drop=True)
        else:
            selected = selected.isel(feature_id=mask)

    # we apply the limit regardless of bbox or not
    if not raster and feature_limit:
        # apply feature limit at the end of processing
        # ideally since this is lazy loaded this should still have
        # predicate pushdown; we need to push this last otherwise
        # we will filter too early and get the start of the dataset which
        # is at an arbitrary location, potentially outside the bbox
        selected = selected.isel(
            feature_id=slice(feature_offset, feature_offset + feature_limit)  # type: ignore
        )

    return selected.load()


def dataset_to_covjson(
    dataset: xr.Dataset,
    x_axis: str | None,
    y_axis: str | None,
    output_crs: pyproj.CRS,
    timeseries_parameter_name: str,
    timeseries_parameter_unit: str,
    time_axis: str | None,
    raster: bool = False,
) -> CoverageCollectionDict | CoverageDict:
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
    if singleItem and not raster:
        time_values = [time_values]
        timeseries_values = [timeseries_values]

    coverages: list[CoverageDict] = []

    authority, code = output_crs.to_authority()
    LATEST = 0
    output_uri = f"http://www.opengis.net/def/crs/{authority}/{LATEST}/{code}"

    if not raster:
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

        coverage_collection: CoverageCollectionDict = {
            "type": "CoverageCollection",
            "parameters": {
                timeseries_parameter_name: {
                    "type": "Parameter",
                    "description": {"en": str(timeseries_parameter_name)},
                    "unit": {"symbol": timeseries_parameter_unit},
                    "observedProperty": {
                        "id": timeseries_parameter_name,
                        "label": {"en": str(timeseries_parameter_name)},
                    },
                }
            },
            "referencing": [
                {
                    "coordinates": ["y", "x"],
                    "system": {
                        "type": "GeographicCRS",
                        "id": output_uri,
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

    if raster:
        assert isinstance(timeseries_values, np.ndarray)
        return {
            "type": "Coverage",
            "domain": {
                "type": "Domain",
                "domainType": "Grid",
                "axes": {
                    "x": {
                        "values": x_values,
                    },
                    "y": {
                        "values": y_values,
                    },
                    "t": {"values": [time_values]},
                },
                "referencing": [
                    {
                        "coordinates": ["y", "x"],
                        "system": {
                            "type": "GeographicCRS",
                            "id": output_uri,
                        },
                    },
                    {
                        "coordinates": ["t"],
                        "system": {
                            "type": "TemporalRS",
                            "calendar": "Gregorian",
                        },
                    },
                ],
            },
            "parameters": {
                timeseries_parameter_name: {
                    "type": "Parameter",
                    "description": {"en": str(timeseries_parameter_name)},
                    "unit": {"symbol": timeseries_parameter_unit},
                    "observedProperty": {
                        "id": str(timeseries_parameter_name),
                        "label": {"en": str(timeseries_parameter_name)},
                    },
                }
            },
            "ranges": {
                timeseries_parameter_name: {
                    "type": "NdArray",
                    "dataType": "float",
                    "axisNames": ["t", "y", "x"],
                    "shape": [
                        len(time_values) if not singleItem else 1,
                        len(y_values),
                        len(x_values),
                    ],
                    "values": [
                        None if np.isnan(val) else val
                        for val in timeseries_values.reshape(-1).tolist()
                    ],
                },
            },
        }
