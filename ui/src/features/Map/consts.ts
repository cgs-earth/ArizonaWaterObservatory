/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { SubLayerId } from '@/features/Map/config';

export const DEFAULT_BBOX: [number, number, number, number] = [
  -114.81651, 31.332177, -109.045223, 37.0042,
];

export const DEFAULT_RASTER_OPACITY = 0.5;
export const DEFAULT_FILL_OPACITY = 0.7;

export const drawLayers = [
  SubLayerId.PolygonFillCold,
  SubLayerId.PolygonFillHot,
  SubLayerId.LinesCold,
  SubLayerId.LinesHot,
  SubLayerId.PointOuterCold,
  SubLayerId.PointOuterHot,
  SubLayerId.PointInnerCold,
  SubLayerId.PointInnerHot,
  SubLayerId.VertexOuterCold,
  SubLayerId.VertexOuterHot,
  SubLayerId.VertexInnerCold,
  SubLayerId.VertexInnerHot,
  SubLayerId.MidpointCold,
  SubLayerId.MidpointHot,
  // SubLayerId.MeasureLine,
  // SubLayerId.MeasurePoints,
  // SubLayerId.MeasureLabel,
];
