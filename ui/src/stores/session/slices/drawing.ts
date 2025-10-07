/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Feature, FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson';
import { StateCreator } from 'zustand';
import { DrawMode, SessionState } from '@/stores/session/types';

export interface DrawingSlice {
  drawMode: DrawMode | null;
  setDrawMode: (drawMode: DrawingSlice['drawMode']) => void;
  drawnShapes: Feature<Polygon | MultiPolygon>[];
  setDrawnShapes: (drawnShapes: DrawingSlice['drawnShapes']) => void;
  addDrawnShape: (drawnShape: Feature<Polygon | MultiPolygon>) => void;
  removeDrawnShape: (id: string) => void;
  hasDrawnShape: (id: string) => boolean;
  measurePoints: FeatureCollection<Point>;
  setMeasurePoints: (points: DrawingSlice['measurePoints']) => void;
  measureLine: FeatureCollection<LineString>;
  setMeasureLine: (measureLine: DrawingSlice['measureLine']) => void;
  measureUnit: 'miles' | 'feet' | 'kilometers';
  setMeasureUnit: (measureUnits: DrawingSlice['measureUnit']) => void;
}

export const createDrawingSlice: StateCreator<
  SessionState,
  [['zustand/immer', never]],
  [],
  DrawingSlice
> = (set, get) => ({
  drawMode: null,
  setDrawMode: (drawMode) => set({ drawMode }),
  drawnShapes: [],
  setDrawnShapes: (drawnShapes) => set({ drawnShapes }),
  addDrawnShape: (drawnShape) =>
    set((state) => ({
      drawnShapes: [...state.drawnShapes, drawnShape],
    })),
  removeDrawnShape: (id) =>
    set((state) => ({
      drawnShapes: state.drawnShapes.filter(
        (drawnShape) => drawnShape.id !== id && drawnShape.properties?.id !== id
      ),
    })),
  hasDrawnShape: (id) =>
    get().drawnShapes.some(
      (drawnShape) => drawnShape.id === id || drawnShape.properties?.id !== id
    ),
  measurePoints: {
    type: 'FeatureCollection',
    features: [],
  },
  setMeasurePoints: (measurePoints) => set({ measurePoints }),
  measureLine: {
    type: 'FeatureCollection',
    features: [],
  },
  setMeasureLine: (measureLine) => set({ measureLine }),
  measureUnit: 'miles',
  setMeasureUnit: (measureUnit) => set({ measureUnit }),
});
