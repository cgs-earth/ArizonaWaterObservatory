/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MainState } from '@/stores/main/types';
import { createCollectionSlice } from './slices/collections';
import { createLayerSlice } from './slices/layers';
import { createLocationSlice } from './slices/locations';

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
  }))
);

export default useMainStore;
