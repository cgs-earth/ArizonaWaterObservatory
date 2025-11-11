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
  updateLayerPosition: (id: Layer['id'], newPosition: number) => void;
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
  updateLayerPosition: (id, newPosition) => {
    set((state) => {
      const layers = [...state.layers];
      const currentIndex = layers.findIndex((l) => l.id === id);
      if (currentIndex === -1) {
        return;
      }

      const oldPosition = layers[currentIndex].position;

      layers[currentIndex].position = newPosition;

      // Shift other layers to avoid duplicate positions
      layers.forEach((l) => {
        if (l.id !== id) {
          if (oldPosition < newPosition && l.position > oldPosition && l.position <= newPosition) {
            l.position -= 1;
          } else if (
            oldPosition > newPosition &&
            l.position < oldPosition &&
            l.position >= newPosition
          ) {
            l.position += 1;
          }
        }
      });

      state.layers = layers.sort((a, b) => a.position - b.position);
    });
  },
});
