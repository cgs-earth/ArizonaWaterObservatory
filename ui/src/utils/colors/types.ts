/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

export enum FriendlyColorBrewerPalettes {
  BlueGreen = 'BuGn',
  BluePurple = 'BuPu',
  GreenBlue = 'GnBu',
  OrangeRed = 'OrRd',
  PurpleBlue = 'PuBu',
  PurpleBlueGreen = 'PuBuGn',
  PurpleRed = 'PuRd',
  RedPurple = 'RdPu',
  YellowGreen = 'YlGn',
  YellowGreenBlue = 'YlGnBu',
  YellowOrangeBrown = 'YlOrBr',
  YellowOrangeRed = 'YlOrRd',
  Blues = 'Blues',
  Greens = 'Greens',
  Greys = 'Greys',
  Oranges = 'Oranges',
  Purples = 'Purples',
  Reds = 'Reds',
}

export type ColorBrewerIndex = 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const validColorBrewerIndex = [3, 4, 5, 6, 7, 8, 9];

export const isValidColorBrewerIndex = (index: number): index is ColorBrewerIndex => {
  return validColorBrewerIndex.includes(index);
};

export type ValidThresholdArray =
  | [number, number, number]
  | [number, number, number, number]
  | [number, number, number, number, number]
  | [number, number, number, number, number, number]
  | [number, number, number, number, number, number, number]
  | [number, number, number, number, number, number, number, number]
  | [number, number, number, number, number, number, number, number, number];

export const isValidThresholdArray = (
  threshholds: number[]
): threshholds is ValidThresholdArray => {
  return validColorBrewerIndex.includes(threshholds.length);
};
