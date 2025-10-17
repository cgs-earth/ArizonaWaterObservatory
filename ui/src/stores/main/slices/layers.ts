/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { Layer, MainState } from '@/stores/main/types';

export interface LayerSlice {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (layer: Layer) => void;
  hasLayer: (options: { layerId?: Layer['id']; collectionId?: Layer['datasourceId'] }) => boolean;
}

export const createLayerSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  LayerSlice
> = (set, get) => ({
  layers: [],
  setLayers: (layers) => set({ layers, configGenerated: false }),
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
      configGenerated: false,
    })),
  updateLayer: (updatedLayer) =>
    set((state) => ({
      layers: state.layers.map((layer) => (layer.id === updatedLayer.id ? updatedLayer : layer)),
      configGenerated: false,
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
