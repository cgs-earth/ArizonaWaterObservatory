/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExtendedFeatureCollection } from '@/managers/types';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';

export const getNextLink = (featureCollection: ExtendedFeatureCollection): string | undefined => {
  if (!featureCollection?.links?.length) {
    return;
  }

  const nextLink = featureCollection.links.find((link) => link.rel === 'next')?.href;

  return nextLink;
};

// Duplicate of function in main manager to prevent circular dependencies
// TODO: move all references from original to this function
export const getLocationsLayerIds = (
  collectionId: ICollection['id'],
  layerId: Layer['id']
): {
  pointLayerId: string;
  fillLayerId: string;
  lineLayerId: string;
  rasterLayerId: string;
} => {
  return {
    pointLayerId: `user-${collectionId}-${layerId}-point`,
    fillLayerId: `user-${collectionId}-${layerId}-fill`,
    lineLayerId: `user-${collectionId}-${layerId}-line`,
    rasterLayerId: `user-${collectionId}-${layerId}-raster`,
  };
};
