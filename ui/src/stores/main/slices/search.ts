/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateCreator } from 'zustand';
import { Layer, MainState, TSearch } from '@/stores/main/types';

export interface ISearchSlice {
  searches: TSearch[];
  setSearches: (searches: TSearch[]) => void;
  addSearch: (layerId: Layer['id'], searchTerm: string, matchedLocations: string[]) => void;
  removeSearch: (layerId: Layer['id']) => void;
  hasSearch: (layerId: Layer['id']) => boolean;
}

export const createSearchSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  ISearchSlice
> = (set, get) => ({
  searches: [],
  setSearches: (searches) =>
    set((state) => {
      state.searches = searches;
    }),
  addSearch: (layerId, searchTerm, matchedLocations) =>
    set((state) => {
      const index = state.searches.findIndex((p) => p.layerId === layerId);

      if (index === -1) {
        state.searches.push({
          layerId,
          searchTerm,
          matchedLocations,
        });

        return;
      }

      state.searches[index] = {
        layerId,
        searchTerm,
        matchedLocations,
      };
    }),
  removeSearch: (layerId) =>
    set((state) => {
      state.searches = state.searches.filter((p) => p.layerId !== layerId);
    }),
  hasSearch: (layerId) => {
    return get().searches.some((p) => p.layerId === layerId);
  },
});
