/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createCollectionSlice } from '@/stores/main/slices/collections';
import { createLayerSlice } from '@/stores/main/slices/layers';
import { createLocationSlice } from '@/stores/main/slices/locations';
import { createSpatialSelectionSlice } from '@/stores/main/slices/spatialSelection';
import { MainState } from '@/stores/main/types';
import { createDrawingSlice } from './slices/drawing';
import { createShareSlice } from './slices/share';

const useMainStore = create<MainState>()(
  immer((set, get, store) => ({
    provider: null,
    setProvider: (provider) => set({ provider, configGenerated: false }),
    category: null,
    setCategory: (category) => set({ category, configGenerated: false }),
    collection: null,
    setCollection: (collection) => set({ collection }),
    charts: [],
    setCharts: (charts: MainState['charts']) => set({ charts }),
    geographyFilter: null,
    setGeographyFilter: (geographyFilter) => set({ geographyFilter, configGenerated: false }),
    hasGeographyFilter: () => Boolean(get().geographyFilter),

    ...createCollectionSlice(set, get, store),
    ...createDrawingSlice(set, get, store),
    ...createLayerSlice(set, get, store),
    ...createLocationSlice(set, get, store),
    ...createShareSlice(set, get, store),
    ...createSpatialSelectionSlice(set, get, store),
  }))
);

export default useMainStore;
