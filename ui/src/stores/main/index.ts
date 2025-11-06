/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BasemapId } from '@/components/Map/types';
import { createCollectionSlice } from '@/stores/main/slices/collections';
import { createDrawingSlice } from '@/stores/main/slices/drawing';
import { createLayerSlice } from '@/stores/main/slices/layers';
import { createLocationSlice } from '@/stores/main/slices/locations';
import { createShareSlice } from '@/stores/main/slices/share';
import { createSpatialSelectionSlice } from '@/stores/main/slices/spatialSelection';
import { MainState } from '@/stores/main/types';

const useMainStore = create<MainState>()(
  immer((set, get, store) => ({
    provider: null,
    setProvider: (provider) => set({ provider, configGenerated: false }),
    category: null,
    setCategory: (category) => set({ category, configGenerated: false }),
    collection: null,
    setCollection: (collection) => set({ collection }),
    basemap: BasemapId.Streets,
    setBasemap: (basemap) => set({ basemap }),

    charts: [],
    setCharts: (charts: MainState['charts']) => set({ charts }),
    geographyFilter: null,
    setGeographyFilter: (geographyFilter) => set({ geographyFilter, configGenerated: false }),
    hasGeographyFilter: () => Boolean(get().geographyFilter),
    parameterGroupMembers: {},
    setParameterGroupMembers: (parameterGroupMembers) => set({ parameterGroupMembers }),
    ...createCollectionSlice(set, get, store),
    ...createDrawingSlice(set, get, store),
    ...createLayerSlice(set, get, store),
    ...createLocationSlice(set, get, store),
    ...createShareSlice(set, get, store),
    ...createSpatialSelectionSlice(set, get, store),
  }))
);

export default useMainStore;
