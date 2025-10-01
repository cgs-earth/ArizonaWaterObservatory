/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LayerId, SubLayerId } from './config';

const getSimpleSelectMessage = (layerId: LayerId | SubLayerId) => {
  switch (layerId) {
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
    case SubLayerId.LinesHot:
    case SubLayerId.LinesCold:
      return 'Drag this shape to reposition or click again to reshape.';

    default:
      return '';
  }
};

const getDirectSelectMessage = (layerId: LayerId | SubLayerId): string => {
  switch (layerId) {
    case SubLayerId.PointInnerCold:
    case SubLayerId.PointInnerHot:
    case SubLayerId.PointOuterCold:
    case SubLayerId.PointOuterHot:
      return 'Click this point to complete the shape.';

    default:
      return '';
  }
};

// const getActiveDrawPolyMessage = (layerId: LayerId | SubLayerId): string => {

// }

// const getStaticDrawPolyMessage = (layerId: LayerId | SubLayerId): string => {

// }

const getDrawPolygonMessage = (layerId: LayerId | SubLayerId): string => {
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
    case SubLayerId.LinesHot:
    case SubLayerId.LinesCold:
      return 'Click to add another vertex, click on the original point to complete the shape.';
    case SubLayerId.PolygonFillCold:
    case SubLayerId.PolygonFillHot:
      return 'Drag this shape to reposition.';
    default:
      return '';
  }
};

export const getMessage = (layerId: LayerId | SubLayerId, active: boolean, mode: string) => {
  console.log('getMessage', active, mode, layerId);
  if (mode === 'draw_polygon') {
    return getDrawPolygonMessage(layerId);
  }

  if (active) {
    if (mode === 'simple_select') {
      return getSimpleSelectMessage(layerId);
    }
    if (mode === 'direct_select') {
      return getDirectSelectMessage(layerId);
    }
  }

  return 'Click on this shape to move or reshape.';
};
