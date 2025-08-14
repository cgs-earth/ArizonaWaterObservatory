/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { MainState } from '@/stores/main/types';

const useMainStore = create<MainState>()((set) => ({
  datasets: [],
  setDatasets: (datasets) => set({ datasets }),
  layers: [],
  setLayers: (layers) => set({ layers }),
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
    })),
  table: null,
  setTable: (table) => set({ table }),
  charts: [],
  setCharts: (charts) => set({ charts }),
  spatialSelections: [],
  setSpatialSelections: (spatialSelections) => set({ spatialSelections }),
}));

export default useMainStore;
