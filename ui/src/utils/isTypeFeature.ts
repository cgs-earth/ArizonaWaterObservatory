/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature, Point, Polygon } from 'geojson';

export const isPolygonFeature = (
  feature: Feature
): feature is Feature<Polygon> =>{
  return  Boolean(feature?.geometry?.type) && feature.geometry.type === 'Polygon'
}

export const isPointFeature = (
  feature: Feature
): feature is Feature<Point> =>{
  return  Boolean(feature?.geometry?.type) && feature.geometry.type === 'Point'
}