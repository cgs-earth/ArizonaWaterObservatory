/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { Layer, MainState } from '@/stores/main/types';

interface LayerSlice {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  hasLayer: (options: { layerId?: Layer['id']; collectionId?: Layer['datasourceId'] }) => boolean;
}

export const createLayerSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  LayerSlice
> = (set, get) => ({
  layers: [],
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
    })),
  hasLayer: ({ layerId, collectionId }) => {
    if (layerId) {
      return get().layers.some((c) => c.id === layerId);
    }
    if (collectionId) {
      return get().layers.some((c) => c.datasourceId === collectionId);
    }
    return false;
  },
});
