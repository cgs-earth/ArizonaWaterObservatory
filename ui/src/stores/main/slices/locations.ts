/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { StateCreator } from 'zustand';
import { Location, MainState } from '@/stores/main/types';

export interface LocationSlice {
  locations: Location[];
  setLocations: (locations: Location[]) => void;
  addLocation: (location: Location) => void;
  removeLocation: (locationId: Location) => void;
  hasLocation: (locationId: Location['id']) => boolean;
}

export const createLocationSlice: StateCreator<
  MainState,
  [['zustand/immer', never]],
  [],
  LocationSlice
> = (set, get) => ({
  locations: [],
  setLocations: (locations) =>
    set((state) => {
      state.locations = locations;
    }),
  addLocation: (location) =>
    set((state) => {
      state.locations.push(location);
    }),
  removeLocation: (location) =>
    set((state) => {
      state.locations = state.locations.filter(
        (loc) => loc.layerId !== location.layerId || loc.id !== location.id
      );
    }),
  hasLocation: (locationId) => get().locations.some((l) => l.id === locationId),
});
