/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoverageAxesSegments,
  CoverageAxesValues,
  CoverageCollection,
  CoverageJSON,
} from '@/services/edr.service';

export const isCoverageCollection = (
  object: Record<string, any> | null
): object is CoverageCollection => {
  return Boolean(object) && object?.type === 'CoverageCollection';
};

export const isCoverageJSON = (object: Record<string, any> | null): object is CoverageJSON => {
  return Boolean(object) && Boolean(object?.type) && object?.type === 'Coverage';
};

export const isAxesValues = (
  object: CoverageAxesSegments | CoverageAxesValues
): object is CoverageAxesValues => {
  return object && 'values' in object && Array.isArray(object.values);
};

export const isFeatureCollection = (object: Record<string, any> | null): object is CoverageJSON => {
  return Boolean(object) && Boolean(object?.type) && object?.type === 'FeatureCollection';
};
