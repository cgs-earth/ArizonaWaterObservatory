/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Geometry } from 'geojson';

export const DEFAULT_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

export const getDefaultGeoJSON = <T extends Geometry>() => {
  const DEFAULT_GEOJSON: FeatureCollection<T> = {
    type: 'FeatureCollection',
    features: [],
  };

  return DEFAULT_GEOJSON;
};
