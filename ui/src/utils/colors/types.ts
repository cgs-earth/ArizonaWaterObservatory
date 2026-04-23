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

  RedGrey = 'RdGy',
  BrowBlueGreen = 'BrBG',
  RedBlue = 'RdBu',
  RedYellowBlue = 'RdYlBu',
  PinkYellowGreen = 'PiYG',
  RedYellowGreen = 'RdYlGn',
  Spectral = 'Spectral',
  Accent = 'Accent',
  Dark = 'Dark2',
  Pastel = 'Pastel1',
}

export const getPaletteLabel = (palette: FriendlyColorBrewerPalettes): string => {
  switch (palette) {
    case FriendlyColorBrewerPalettes.BlueGreen:
      return 'Blue-Green';
    case FriendlyColorBrewerPalettes.BluePurple:
      return 'Blue-Purple';
    case FriendlyColorBrewerPalettes.GreenBlue:
      return 'Green-Blue';
    case FriendlyColorBrewerPalettes.OrangeRed:
      return 'Orange-Red';
    case FriendlyColorBrewerPalettes.PurpleBlue:
      return 'Purple-Blue';
    case FriendlyColorBrewerPalettes.PurpleBlueGreen:
      return 'Purple-Blue-Green';
    case FriendlyColorBrewerPalettes.PurpleRed:
      return 'Purple-Red';
    case FriendlyColorBrewerPalettes.RedPurple:
      return 'Red-Purple';
    case FriendlyColorBrewerPalettes.YellowGreen:
      return 'Yellow-Green';
    case FriendlyColorBrewerPalettes.YellowGreenBlue:
      return 'Yellow-Green-Blue';
    case FriendlyColorBrewerPalettes.YellowOrangeBrown:
      return 'Yellow-Orange-Brown';
    case FriendlyColorBrewerPalettes.YellowOrangeRed:
      return 'Yellow-Orange-Red';
    case FriendlyColorBrewerPalettes.Blues:
      return 'Blues';
    case FriendlyColorBrewerPalettes.Greens:
      return 'Greens';
    case FriendlyColorBrewerPalettes.Greys:
      return 'Greys';
    case FriendlyColorBrewerPalettes.Oranges:
      return 'Oranges';
    case FriendlyColorBrewerPalettes.Purples:
      return 'Purples';
    case FriendlyColorBrewerPalettes.Reds:
      return 'Reds';
    case FriendlyColorBrewerPalettes.RedGrey:
      return 'Red-Grey';
    case FriendlyColorBrewerPalettes.BrowBlueGreen:
      return 'Brown-Blue-Green';
    case FriendlyColorBrewerPalettes.RedBlue:
      return 'Red-Blue';
    case FriendlyColorBrewerPalettes.RedYellowBlue:
      return 'Red-Yellow-Blue';
    case FriendlyColorBrewerPalettes.PinkYellowGreen:
      return 'Pink-Yellow-Green';
    case FriendlyColorBrewerPalettes.RedYellowGreen:
      return 'Red-Yellow-Green';
    case FriendlyColorBrewerPalettes.Spectral:
      return 'Spectral';
    case FriendlyColorBrewerPalettes.Accent:
      return 'Accent';
    case FriendlyColorBrewerPalettes.Dark:
      return 'Dark';
    case FriendlyColorBrewerPalettes.Pastel:
      return 'Pastel';
    default:
      return palette; // fallback to raw code if unknown
  }
};

export type ColorBrewerIndex = 3 | 4 | 5 | 6 | 7 | 8;

export const validColorBrewerIndex = [3, 4, 5, 6, 7, 8];

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
