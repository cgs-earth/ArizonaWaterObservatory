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

const useMainStore = create<MainState>()(
  immer((set, get, store) => ({
    provider: null,
    setProvider: (provider) => set({ provider }),
    category: null,
    setCategory: (category) => set({ category }),
    collection: null,
    setCollection: (collection) => set({ collection }),
    charts: [],
    setCharts: (charts: MainState['charts']) => set({ charts }),
    geographyFilter: null,
    setGeographyFilter: (geographyFilter) => set({ geographyFilter }),
    hasGeographyFilter: () => Boolean(get().geographyFilter),

    ...createCollectionSlice(set, get, store),
    ...createLayerSlice(set, get, store),
    ...createLocationSlice(set, get, store),
    ...createSpatialSelectionSlice(set, get, store),
  }))
);

export default useMainStore;
