/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Polygon } from 'geojson';
import { Properties } from '@/components/Map/types';
import { ICollection } from '@/services/edr.service';
import { CollectionSlice } from '@/stores/main/slices/collections';
import { LayerSlice } from '@/stores/main/slices/layers';
import { LocationSlice } from '@/stores/main/slices/locations';
import { SpatialSelectionSlice } from '@/stores/main/slices/spatialSelection';
import { DrawingSlice } from './slices/drawing';
import { ShareSlice } from './slices/share';

export type ColorValueHex = `#${string}`;

enum DataVisualization {
  Timeseries = 'timeseries',
  Hydrograph = 'hydrograph',
  Teacup = 'teacup',
}

export enum SpatialSelectionType {
  Drawn = 'custom-drawn-polygon',
  Selected = 'select-existing-polygons',
  Upload = 'custom-upload-shape',
}

export interface SpatialSelectionBase {
  type: SpatialSelectionType;
}

export interface SpatialSelectionDrawn extends SpatialSelectionBase {
  type: SpatialSelectionType.Drawn;
  featureCollection: FeatureCollection<Polygon, Properties>[];
}

export interface SpatialSelectionUpload extends SpatialSelectionBase {
  type: SpatialSelectionType.Upload;
  featureCollection: FeatureCollection<Polygon, Properties>[];
}

export interface SpatialSelectionSelected extends SpatialSelectionBase {
  type: SpatialSelectionType.Selected;
  locations: string[]; // location IDs
}

// Discriminated union for all spatial selection types
export type SpatialSelection =
  | SpatialSelectionDrawn
  | SpatialSelectionUpload
  | SpatialSelectionSelected;

export enum DatasourceType {
  Point = 'point',
  Line = 'line',
  Polygon = 'polygon',
  Raster = 'raster',
}

export type Filter = {
  datasets: string[];
  providers: string[];
  categories: string[];
  dateAvailable: string; // Date time?
};

export type Layer = {
  id: string; // uuid
  datasourceId: ICollection['id'];
  name: string; // User defined
  color: string; // User defined, restrict to 6 char code if possible
  parameters: string[]; // Id's of parameter as returned by datasource
  from: string | null; // UTC timestamp
  to: string | null; // UTC timestamp
  visible: boolean; // visible ? 'visible' : 'none'
  locations: string[]; // locationId's
};

export type Table = {
  layer: Layer['id'];
  location: string;
  parameter: string; // id of parameter as returned by datasource
};

export type Chart = {
  layer: Layer['id'];
  location: string;
  parameter: string; // id of parameter as returned by datasource
  dataVisualization: DataVisualization;
};

export type Location = {
  id: string | number; // location/{this}
  layerId: Layer['id'];
};

export type Category = {
  value: string;
  label: string;
};

export enum DrawMode {
  Polygon = 'polygon',
  Measure = 'measure',
  Select = 'select',
}

export type MainState = {
  provider: string | null;
  setProvider: (provider: MainState['provider']) => void;
  category: Category | null;
  setCategory: (category: MainState['category']) => void;
  collection: string | null;
  setCollection: (collection: MainState['collection']) => void;
  geographyFilter: any | null;
  setGeographyFilter: (geographyFilter: MainState['geographyFilter']) => void;
  hasGeographyFilter: () => boolean;

  charts: Chart[];
  setCharts: (charts: MainState['charts']) => void;
} & CollectionSlice &
  LocationSlice &
  LayerSlice &
  SpatialSelectionSlice &
  DrawingSlice &
  ShareSlice;
