/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature } from 'geojson';

export const getLabel = (feature: Feature, label: string): string | undefined => {
  if (feature.properties && feature.properties[label]) {
    return feature.properties[label];
  }
};
