/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { FeatureCollection, Point } from 'geojson';
import { StateCreator } from 'zustand';
import { DrawMode, SessionState } from '@/stores/session/types';

export interface DrawingSlice {
  drawMode: DrawMode | null;
  setDrawMode: (drawMode: DrawingSlice['drawMode']) => void;
  points: FeatureCollection<Point>;
  setPoints: (points: DrawingSlice['points']) => void;
}

export const createDrawingSlice: StateCreator<
  SessionState,
  [['zustand/immer', never]],
  [],
  DrawingSlice
> = (set) => ({
  drawMode: null,
  setDrawMode: (drawMode) => set({ drawMode }),
  points: {
    type: 'FeatureCollection',
    features: [],
  },
  setPoints: (points) => set({ points }),
});
