/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import colorbrewer from 'colorbrewer';
import { Feature, Geometry } from 'geojson';
import { ExpressionSpecification } from 'mapbox-gl';
import { Layer } from '@/stores/main/types';
import {
  ColorBrewerIndex,
  FriendlyColorBrewerPalettes,
  validColorBrewerIndex,
  ValidThresholdArray,
} from '@/utils/colors/types';

export const createColorRange = (count: number, scheme: FriendlyColorBrewerPalettes): string[] => {
  if (!validColorBrewerIndex.includes(count)) {
    throw new Error(`Palette "${scheme}" does not support ${count} colors`);
  }

  const index = count as ColorBrewerIndex;
  const palette = colorbrewer[scheme][index];

  return palette;
};

export const getGradient = (groups: number, palette: FriendlyColorBrewerPalettes) => {
  return createColorRange(groups, palette);
};

const formatStepExpression = (
  property: string,
  palette: FriendlyColorBrewerPalettes,
  values: number[]
): ExpressionSpecification => {
  const colorRange = createColorRange(values.length + 1, palette);

  const expression: ExpressionSpecification = [
    'step',
    ['number', ['at', 0, ['get', property]], 0],
    colorRange[0], // Default Color
  ];

  for (let i = 0; i < values.length; i++) {
    expression.push(values[i], colorRange[i + 1]);
  }

  return expression;
};

export const groupData = (data: number[], numGroups: number): number[] => {
  if (numGroups < 1) {
    throw new Error('Number of groups must be at least 1.');
  }

  const sorted = [...data].sort((a, b) => a - b);
  const thresholds: number[] = [];

  for (let i = 1; i < numGroups; i++) {
    const pos = (i * (sorted.length - 1)) / numGroups;
    const lower = Math.floor(pos);
    const upper = Math.ceil(pos);
    const weight = pos - lower;
    const threshold = sorted[lower] * (1 - weight) + sorted[upper] * weight;
    thresholds.push(threshold);
  }

  return thresholds;
};

export const createDynamicStepExpression = <T>(
  features: Feature<Geometry, T>[],
  property: keyof T,
  palette: FriendlyColorBrewerPalettes,
  groups: number
): ExpressionSpecification => {
  const data = features.flatMap((feature) => {
    if (Array.isArray(feature.properties[property])) {
      // Get the earliest value
      const value = Number(feature.properties[property][0] ?? 0);

      if (isNaN(value)) {
        throw new Error(`Invalid number detected in property: ${String(property)}`);
      }

      return value;
    }

    return 0;
  });

  const thresholds = groupData(data, groups);

  const expression = formatStepExpression(String(property), palette, thresholds);

  return expression;
};

export const createStaticStepExpression = (
  property: string,
  palette: FriendlyColorBrewerPalettes,
  thresholds: ValidThresholdArray
): ExpressionSpecification => {
  const expression = formatStepExpression(property, palette, thresholds);

  return expression;
};

export const isSamePalette = (
  paletteA: Layer['paletteDefinition'],
  paletteB: Layer['paletteDefinition']
): boolean => {
  return Boolean(
    (!paletteA && !paletteB) ||
      (paletteA &&
        paletteB &&
        paletteA.count === paletteB.count &&
        paletteA.palette === paletteB.palette &&
        paletteA.parameter === paletteB.parameter)
  );
};
