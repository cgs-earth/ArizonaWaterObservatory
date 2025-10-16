/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import {
  MainState,
  SpatialSelection,
  SpatialSelectionDrawn,
  SpatialSelectionSelected,
  SpatialSelectionType,
  SpatialSelectionUpload,
} from '@/stores/main/types';

export interface SpatialSelectionSlice {
  spatialSelection: SpatialSelection | null;
  setSpatialSelection: (spatialSelection: SpatialSelectionSlice['spatialSelection']) => void;
  setSpatialSelectionDrawn: (featureCollection: SpatialSelectionDrawn['featureCollection']) => void;
  setSpatialSelectionUpload: (
    featureCollection: SpatialSelectionUpload['featureCollection']
  ) => void;
  setSpatialSelectionSelected: (locations: SpatialSelectionSelected['locations']) => void;
  hasSpatialSelection: () => boolean;
  hasSpatialSelectionType: (type: SpatialSelectionType) => boolean;
}

export const createSpatialSelectionSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  SpatialSelectionSlice
> = (set, get) => ({
  spatialSelection: null,
  setSpatialSelection: (spatialSelection) => set({ spatialSelection, configGenerated: false }),
  setSpatialSelectionDrawn: (featureCollection) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Drawn,
        featureCollection,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionUpload: (featureCollection) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Upload,
        featureCollection,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionSelected: (locations) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Selected,
        locations,
      };
      state.configGenerated = false;
    }),
  hasSpatialSelection: () => get().spatialSelection !== null,
  hasSpatialSelectionType: (type) => {
    const spatialSelection = get().spatialSelection;

    return Boolean(spatialSelection && spatialSelection.type === type);
  },
});
