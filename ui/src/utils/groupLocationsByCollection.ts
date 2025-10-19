/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Location } from '@/stores/main/types';

export const groupLocationIdsByLayer = (
  locations: Location[]
): Record<Location['layerId'], Array<Location['id']>> => {
  return locations.reduce(
    (acc, location) => {
      const { layerId, id } = location;
      if (!acc[layerId]) {
        acc[layerId] = [];
      }
      acc[layerId].push(id);
      return acc;
    },
    {} as Record<Location['layerId'], Array<Location['id']>>
  );
};
