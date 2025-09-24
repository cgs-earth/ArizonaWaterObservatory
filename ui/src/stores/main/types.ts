/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Polygon } from 'geojson';
import { Properties } from '@/components/Map/types';
import { ICollection } from '@/services/edr.service';

export type ColorValueHex = `#${string}`;

enum DataVisualization {
  Timeseries = 'timeseries',
  Hydrograph = 'hydrograph',
  Teacup = 'teacup',
}

enum SpatialSelectionType {
  Drawn = 'custom-drawn-polygon',
  Selected = 'select-existing-polygons',
  Upload = 'custom-upload-shape',
}

interface SpatialSelectionBase {
  type: SpatialSelectionType;
}

interface SpatialSelectionDrawn extends SpatialSelectionBase {
  type: SpatialSelectionType.Drawn;
  shapes: FeatureCollection<Polygon, Properties>[];
}

interface SpatialSelectionUpload extends SpatialSelectionBase {
  type: SpatialSelectionType.Upload;
  shapes: FeatureCollection<Polygon, Properties>[];
}

interface SpatialSelectionSelected extends SpatialSelectionBase {
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
  color: ColorValueHex; // User defined, restrict to 6 char code if possible
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

export interface MainState {
  provider: string | null;
  setProvider: (provider: MainState['provider']) => void;
  category: Category | null;
  setCategory: (category: MainState['category']) => void;
  collection: string | null;
  setCollection: (collection: MainState['collection']) => void;
  geographyFilter: any | null;
  setGeographyFilter: (geographyFilter: MainState['geographyFilter']) => void;
  hasGeographyFilter: () => boolean;
  collections: any[]; // TODO
  setCollections: (collections: MainState['collections']) => void;
  originalCollections: any[];
  setOriginalCollections: (collections: MainState['collections']) => void;
  addCollection: (collection: any) => void;
  hasCollection: (collectionId: any['id']) => boolean;
  charts: Chart[];
  setCharts: (layers: MainState['charts']) => void;
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  hasLayer: (options: { layerId?: Layer['id']; collectionId?: Layer['datasourceId'] }) => boolean;
  locations: Location[];
  setLocations: (locations: MainState['locations']) => void;
  addLocation: (location: Location) => void;
  hasLocation: (locationId: Location['id']) => boolean;
  removeLocation: (locationId: Location['id']) => void;
}
