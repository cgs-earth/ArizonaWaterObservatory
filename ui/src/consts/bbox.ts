/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { PredefinedBoundary } from '@/stores/main/types';

// Narrower type than `geojson` type
type BBox = [number, number, number, number];

export const ArizonaBBox: BBox = [-114.81651, 31.332176999999998, -109.045223, 37.004259999999995];

export const LowerColoradoRegionBBox: BBox = [-115.7059785, 29.8385906, -107.7850907, 39.302841];
export const UpperColoradoRegionBBox: BBox = [-112.328642, 35.5600937, -105.6265665, 43.4521139];

export const ColoradoRiverBasinBBox: BBox = [-115.7059785, 29.8385906, -105.6265665, 43.4521139];

export const getBBox = (boundary: PredefinedBoundary): BBox => {
  switch (boundary) {
    case PredefinedBoundary.ColoradoRiverBasin:
      return ColoradoRiverBasinBBox;

    case PredefinedBoundary.Arizona:
    default:
      return ArizonaBBox;
  }
};

export const getStateList = (boundary: PredefinedBoundary, strict: boolean): string[] => {
  if (boundary === PredefinedBoundary.ColoradoRiverBasin) {
    const states = ['arizona', 'new mexico', 'colorado', 'utah', 'wyoming', 'nevada', 'california'];
    if (!strict) {
      states.push('idaho');
    }
    return states;
  }

  return ['arizona'];
};
