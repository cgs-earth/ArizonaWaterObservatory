/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { MainState } from '@/stores/main/types';

export interface ShareSlice {
  shareId: string;
  setShareId: (shareId: ShareSlice['shareId']) => void;
  configGenerated: boolean;
  setConfigGenerated: (configGenerated: ShareSlice['configGenerated']) => void;
}

export const createShareSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  ShareSlice
> = (set) => ({
  configGenerated: true,
  setConfigGenerated: (configGenerated) => set({ configGenerated }),
  shareId: '',
  setShareId: (shareId) => set({ shareId }),
});
