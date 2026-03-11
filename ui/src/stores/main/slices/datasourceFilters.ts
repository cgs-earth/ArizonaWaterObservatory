/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { Category, MainState } from '@/stores/main/types';

export interface IFilterSlice {
  searchTerm: string | null;
  setSearchTerm: (searchTerm: IFilterSlice['searchTerm']) => void;
  provider: string | null;
  setProvider: (provider: IFilterSlice['provider']) => void;
  category: Category | null;
  setCategory: (category: IFilterSlice['category']) => void;
  collection: string | null;
  setCollection: (collection: IFilterSlice['collection']) => void;
}

export const createFilterSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  IFilterSlice
> = (set, _get) => ({
  searchTerm: null,
  setSearchTerm: (searchTerm) => set({ searchTerm, configGenerated: false }),
  provider: null,
  setProvider: (provider) => set({ provider, configGenerated: false }),
  category: null,
  setCategory: (category) => set({ category, configGenerated: false }),
  collection: null,
  setCollection: (collection) => set({ collection }),
});
