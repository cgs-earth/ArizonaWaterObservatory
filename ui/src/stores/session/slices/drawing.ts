/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { DrawMode, SessionState } from '@/stores/session/types';

export interface DrawingSlice {
  drawMode: DrawMode | null;
  setDrawMode: (drawMode: DrawingSlice['drawMode']) => void;
}

export const createDrawingSlice: StateCreator<
  SessionState,
  [['zustand/immer', never]],
  [],
  DrawingSlice
> = (set) => ({
  drawMode: null,
  setDrawMode: (drawMode: DrawingSlice['drawMode']) => set({ drawMode }),
});
