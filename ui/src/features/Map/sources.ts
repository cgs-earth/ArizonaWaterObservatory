/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { SourceConfig, Sources } from '@/components/Map/types';

export enum SourceId {
  MeasurePoints = 'measure-points',
  MeasureLine = 'measure-line',
}

/**
 * Configurations for sources in the map. Supports GeoJSON, VectorTile, and Esri Feature Service sources
 *
 * @constant
 */
export const sourceConfigs: SourceConfig[] = [
  {
    id: SourceId.MeasurePoints,
    type: Sources.GeoJSON,
    definition: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: false,
    },
  },
  {
    id: SourceId.MeasureLine,
    type: Sources.GeoJSON,
    definition: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
      cluster: false,
    },
  },
];
