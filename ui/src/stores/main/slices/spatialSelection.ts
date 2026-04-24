/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateCreator } from 'zustand';
import {
  MainState,
  PredefinedBoundary,
  SpatialSelection,
  SpatialSelectionDrawn,
  SpatialSelectionPredefined,
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
  setSpatialSelectionPredefinedBoundary: (boundary: SpatialSelectionPredefined['boundary']) => void;
  setSpatialSelectionStrict: (strict: SpatialSelection['strict']) => void;
  hasSpatialSelection: () => boolean;
  hasSpatialSelectionType: (type: SpatialSelectionType) => boolean;
}

export const isSpatialSelectionDrawn = (
  selection: SpatialSelection
): selection is SpatialSelectionDrawn => {
  return selection.type === SpatialSelectionType.Drawn;
};

export const isSpatialSelectionUpload = (
  selection: SpatialSelection
): selection is SpatialSelectionUpload => {
  return selection.type === SpatialSelectionType.Upload;
};

export const isSpatialSelectionSelected = (
  selection: SpatialSelection
): selection is SpatialSelectionSelected => {
  return selection.type === SpatialSelectionType.Selected;
};

export const isSpatialSelectionPredefined = (
  selection: SpatialSelection
): selection is SpatialSelectionPredefined => {
  return selection.type === SpatialSelectionType.Predefined;
};

export const isPredefinedBoundary = (boundary: string): boundary is PredefinedBoundary =>
  Object.values<string>(PredefinedBoundary).includes(boundary);

export const createSpatialSelectionSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  SpatialSelectionSlice
> = (set, get) => ({
  spatialSelection: {
    type: SpatialSelectionType.Predefined,
    boundary: PredefinedBoundary.Arizona,
    strict: false,
  },
  setSpatialSelection: (spatialSelection) => set({ spatialSelection, configGenerated: false }),
  setSpatialSelectionDrawn: (featureCollection) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Drawn,
        featureCollection,
        strict: state.spatialSelection?.strict ?? false,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionUpload: (featureCollection) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Upload,
        featureCollection,
        strict: state.spatialSelection?.strict ?? false,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionSelected: (locations) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Selected,
        locations,
        strict: state.spatialSelection?.strict ?? false,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionPredefinedBoundary: (boundary) =>
    set((state) => {
      state.spatialSelection = {
        type: SpatialSelectionType.Predefined,
        boundary,
        strict: state.spatialSelection?.strict ?? false,
      };
      state.configGenerated = false;
    }),
  setSpatialSelectionStrict: (strict) =>
    set((state) => {
      if (state.spatialSelection) {
        state.spatialSelection = {
          ...state.spatialSelection,
          strict,
        };
        state.configGenerated = false;
      }
    }),
  hasSpatialSelection: () => get().spatialSelection !== null,
  hasSpatialSelectionType: (type) => {
    const spatialSelection = get().spatialSelection;

    return Boolean(spatialSelection && spatialSelection.type === type);
  },
});
