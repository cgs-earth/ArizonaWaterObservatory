/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { FeatureCollection, LineString, Point } from 'geojson';
import { StateCreator } from 'zustand';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { SessionState } from '@/stores/session/types';

export type MeasureUnit = 'miles' | 'feet' | 'kilometers';

export interface MeasureSlice {
  measurePoints: FeatureCollection<Point>;
  setMeasurePoints: (points: MeasureSlice['measurePoints']) => void;
  measureLine: FeatureCollection<LineString>;
  setMeasureLine: (measureLine: MeasureSlice['measureLine']) => void;
  measureUnit: MeasureUnit;
  setMeasureUnit: (measureUnits: MeasureSlice['measureUnit']) => void;
}

export const createMeasureSlice: StateCreator<
  SessionState,
  [['zustand/immer', never]],
  [],
  MeasureSlice
> = (set) => ({
  measurePoints: getDefaultGeoJSON<Point>(),
  setMeasurePoints: (measurePoints) => set({ measurePoints }),
  measureLine: getDefaultGeoJSON<LineString>(),
  setMeasureLine: (measureLine) => set({ measureLine }),
  measureUnit: 'miles',
  setMeasureUnit: (measureUnit) => set({ measureUnit }),
});
