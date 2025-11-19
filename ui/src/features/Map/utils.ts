/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { bboxPolygon, booleanContains } from '@turf/turf';
import { ExpressionSpecification, GeoJSONFeature, Map } from 'mapbox-gl';
import { idStoreProperty } from '@/consts/collections';
import { LayerId, SubLayerId } from '@/features/Map/config';
import { Location } from '@/stores/main/types';

const getSimpleSelectMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
    case SubLayerId.LinesCold:
    case SubLayerId.LinesHot:
      return 'Drag this shape to reposition or click again to reshape.';
    default:
      return '';
  }
};

const getActiveDirectSelectMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.VertexInnerCold:
    case SubLayerId.VertexInnerHot:
    case SubLayerId.VertexOuterCold:
    case SubLayerId.VertexOuterHot:
      return 'Drag this point to change position.';
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
      return 'Drag this shape to reposition.';
    case SubLayerId.LinesCold:
    case SubLayerId.LinesHot:
      return 'Click the midpoint indicator to add another vertex.';
    default:
      return '';
  }
};

const getStaticDirectSelectMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.VertexInnerCold:
    case SubLayerId.VertexInnerHot:
    case SubLayerId.VertexOuterCold:
    case SubLayerId.VertexOuterHot:
      return 'Click this point to enable editing.';
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
      return 'Drag this shape to reposition.';
    case SubLayerId.LinesCold:
    case SubLayerId.LinesHot:
      return 'Click the midpoint indicator to add another vertex.';
    default:
      return '';
  }
};

const getDirectSelectMessage = (layerId: LayerId | SubLayerId, active: boolean): string => {
  return active ? getActiveDirectSelectMessage(layerId) : getStaticDirectSelectMessage(layerId);
};

const getActiveDrawPolyMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.PointInnerCold:
    case SubLayerId.PointInnerHot:
    case SubLayerId.PointOuterCold:
    case SubLayerId.PointOuterHot:
    case SubLayerId.VertexInnerCold:
    case SubLayerId.VertexInnerHot:
    case SubLayerId.VertexOuterCold:
    case SubLayerId.VertexOuterHot:
      return 'Click this point to complete the shape.';
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
    case SubLayerId.LinesCold:
    case SubLayerId.LinesHot:
      return 'Click to add another vertex, click on the original point to complete the shape.';
    default:
      return '';
  }
};

const getStaticDrawPolyMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.PointInnerCold:
    case SubLayerId.PointInnerHot:
    case SubLayerId.PointOuterCold:
    case SubLayerId.PointOuterHot:
    case SubLayerId.VertexInnerCold:
    case SubLayerId.VertexInnerHot:
    case SubLayerId.VertexOuterCold:
    case SubLayerId.VertexOuterHot:
      return 'Click this point to complete the shape.';
    default:
      return '';
  }
};

const getDrawPolygonMessage = (layerId: LayerId | SubLayerId, active: boolean): string => {
  return active ? getActiveDrawPolyMessage(layerId) : getStaticDrawPolyMessage(layerId);
};

export const getMessage = (
  layerId: LayerId | SubLayerId,
  active: boolean,
  mode: string
): string => {
  if (mode === 'draw_polygon') {
    return getDrawPolygonMessage(layerId, active);
  }

  if (active) {
    if (mode === 'simple_select') {
      return getSimpleSelectMessage(layerId);
    }
    if (mode === 'direct_select') {
      return getDirectSelectMessage(layerId, active);
    }
  }

  return 'Click on this shape to move or reshape.';
};

export const getSelectedColor = (
  locationIds: Array<Location['id']>,
  originalColor: string = '#000'
): ExpressionSpecification => {
  return [
    'case',
    ['in', ['to-string', ['coalesce', ['get', idStoreProperty], ['id']]], ['literal', locationIds]],
    '#FFF',
    originalColor,
  ];
};

export const getSortKey = (locationIds: Array<Location['id']>): ExpressionSpecification => {
  return [
    'case',
    ['in', ['to-string', ['coalesce', ['get', idStoreProperty], ['id']]], ['literal', locationIds]],
    1,
    0,
  ];
};

export const drawnFeatureContainsExtent = (
  drawnFeature: GeoJSONFeature,
  draw: MapboxDraw,
  map: Map
): boolean => {
  const bounds = map.getBounds();
  const drawnFeatures = draw.getAll();
  if (drawnFeatures.features.length && bounds) {
    const targetFeature = drawnFeatures.features.find(
      (feature) => feature.id === drawnFeature.properties?.id
    );
    if (targetFeature) {
      const extentPolygon = bboxPolygon([
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ]);

      return booleanContains(targetFeature, extentPolygon);
    }
  }

  return false;
};
