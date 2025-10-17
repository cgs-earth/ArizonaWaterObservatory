/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LngLat, LngLatBoundsLike } from 'mapbox-gl';
import { MainState } from '@/stores/main/types';

export const SHARE_VARIABLE = 'shareId';

export type PostConfigResponse = {
  success: boolean;
  response: string[];
};

export type GetConfigResponse = {
  success: boolean;
  response: Config | string;
};

export type Config = {
  layers: MainState['layers'];
  provider: MainState['provider'];
  category: MainState['category'];
  collection: MainState['collection'];
  charts: MainState['charts'];
  locations: MainState['locations'];
  drawnShapes: MainState['drawnShapes'];
  basemap: MainState['basemap'];
  bounds: LngLatBoundsLike | null;
  zoom: number;
  center: LngLat;
  bearing: number;
  pitch: number;
};
