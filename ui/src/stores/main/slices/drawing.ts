/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Feature, MultiPolygon, Polygon } from 'geojson';
import { StateCreator } from 'zustand';
import { DrawMode, MainState } from '@/stores/main/types';

export interface DrawingSlice {
  drawMode: DrawMode | null;
  setDrawMode: (drawMode: DrawingSlice['drawMode']) => void;
  drawnShapes: Feature<Polygon | MultiPolygon>[];
  setDrawnShapes: (drawnShapes: DrawingSlice['drawnShapes']) => void;
  addDrawnShape: (drawnShape: Feature<Polygon | MultiPolygon>) => void;
  removeDrawnShape: (id: string) => void;
  hasDrawnShape: (id: string) => boolean;
}

export const createDrawingSlice: StateCreator<
  MainState,
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
});
