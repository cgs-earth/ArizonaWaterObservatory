/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature } from 'geojson';
import { GeoJSONFeature, Map } from 'mapbox-gl';
import { DATES_PROPERTY } from '@/services/coverageJSON/consts';
import { factoryService, mainManager } from '@/services/init';
import { Layer } from '@/stores/main/types';

const getDatesFromProperties = (feature: GeoJSONFeature | Feature): string[] => {
  if (feature.properties) {
    const dates = feature.properties[DATES_PROPERTY] as string[] | string;

    if (Array.isArray(dates)) {
      return dates;
    } else if (typeof dates === 'string') {
      const parsedDates = JSON.parse(dates) as string[];
      return parsedDates;
    }
  }

  throw new Error('No properties found on this feature.');
};

export const getDates = async (map: Map, layer: Layer): Promise<string[]> => {
  const { pointLayerId, lineLayerId, fillLayerId } = factoryService.getLocationsLayerIds(
    layer.datasourceId,
    layer.id
  );

  if (map.getLayer(pointLayerId) && map.getLayer(lineLayerId) && map.getLayer(fillLayerId)) {
    // For speed of access, check map first
    const features = map.queryRenderedFeatures({
      layers: [pointLayerId, lineLayerId, fillLayerId],
    });

    if (features.length > 0) {
      const feature = features[0];
      return getDatesFromProperties(feature);
    }

    // Fallback to more costly potential fetch
    const featureCollection = await mainManager.getFeatures(layer);
    if (featureCollection.features.length > 0) {
      const feature = featureCollection.features[0];

      return getDatesFromProperties(feature);
    }
  }

  throw new Error('No features found.');
};
