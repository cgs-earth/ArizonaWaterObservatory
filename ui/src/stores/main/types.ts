/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Polygon } from 'geojson';
import { Properties } from '@/components/Map/types';

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

export type Datasource = {
  id: string;
  type: DatasourceType;
  name: string; // Friendly Name of Datasource
  provider: string; // NOAA, USGS etc
  dateAvailable: string; // UTC timestamp
  parameters: string[]; // curated list of parameters
  category: string; // Streamflow, precip, temp etc
  dataset: string; // real-time, forecast, short-term etc
  dataVisualizations: DataVisualization[];
};

export type Layer = {
  id: string; // uuid
  datasourceId: Datasource['id'];
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

export interface MainState {
  datasources: Datasource[];
  setDatasources: (datasources: MainState['datasources']) => void;
  layers: Layer[];
  setLayers: (layers: MainState['layers']) => void;
  addLayer: (layer: Layer) => void;
  table: Table | null;
  setTable: (table: MainState['table']) => void;
  charts: Chart[];
  setCharts: (layers: MainState['charts']) => void;
  spatialSelections: SpatialSelection[];
  setSpatialSelections: (spatialSelections: MainState['spatialSelections']) => void;
}
