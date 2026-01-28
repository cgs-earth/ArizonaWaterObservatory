/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Map, Point } from 'mapbox-gl';
import { drawLayers } from '@/features/Map/consts';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';

export const isTopLayer = (
  layerId: Layer['id'],
  collectionId: ICollection['id'],
  map: Map,
  point: Point,
  includeDrawLayers: boolean = false
) => {
  // As layers can be added in any order, and reordered, perform manual check to ensure popup shows
  // for top layer in visual order
  const { pointLayerId, fillLayerId, lineLayerId } = mainManager.getLocationsLayerIds(
    collectionId,
    layerId
  );

  const allLayers = useMainStore.getState().layers.flatMap((layer) => {
    const { pointLayerId, fillLayerId, lineLayerId } = mainManager.getLocationsLayerIds(
      layer.datasourceId,
      layer.id
    );
    return [pointLayerId, fillLayerId, lineLayerId];
  });

  // If draw layers should be included, add them to the list
  const layersToQuery = includeDrawLayers ? [...allLayers, ...drawLayers] : allLayers;

  const renderedFeatures = map.queryRenderedFeatures(point, {
    layers: layersToQuery,
  });

  if (!renderedFeatures.length) {
    return false;
  }

  // This layer is on top of visual order
  const topLayerId = renderedFeatures[0]?.layer?.id ?? '';

  return [pointLayerId, fillLayerId, lineLayerId].includes(topLayerId);
};
