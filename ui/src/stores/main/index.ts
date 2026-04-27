/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { BasemapId } from '@/components/Map/types';
import { createCollectionSlice } from '@/stores/main/slices/collections';
import { createFilterSlice } from '@/stores/main/slices/datasourceFilters';
import { createDrawingSlice } from '@/stores/main/slices/drawing';
import { createLayerSlice } from '@/stores/main/slices/layers';
import { createLocationSlice } from '@/stores/main/slices/locations';
import { createSearchSlice } from '@/stores/main/slices/search';
import { createShareSlice } from '@/stores/main/slices/share';
import { createSpatialSelectionSlice } from '@/stores/main/slices/spatialSelection';
import { MainState } from '@/stores/main/types';

const useMainStore = create<MainState>()(
  immer((set, get, store) => ({
    charts: [],
    setCharts: (charts: MainState['charts']) => set({ charts }),
    geographyFilter: null,
    setGeographyFilter: (geographyFilter) => set({ geographyFilter, configGenerated: false }),
    hasGeographyFilter: () => Boolean(get().geographyFilter),
    basemap: BasemapId.Streets,
    setBasemap: (basemap) => set({ basemap, configGenerated: false }),
    terrainActive: false,
    setTerrainActive: (terrainActive) => set({ terrainActive, configGenerated: false }),
    parameterGroupMembers: {},
    setParameterGroupMembers: (parameterGroupMembers) => set({ parameterGroupMembers }),
    ...createCollectionSlice(set, get, store),
    ...createDrawingSlice(set, get, store),
    ...createFilterSlice(set, get, store),
    ...createLayerSlice(set, get, store),
    ...createLocationSlice(set, get, store),
    ...createSearchSlice(set, get, store),
    ...createShareSlice(set, get, store),
    ...createSpatialSelectionSlice(set, get, store),
  }))
);

export default useMainStore;
