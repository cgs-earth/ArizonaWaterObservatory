/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionType } from '@/utils/collection';

export enum CollectionId {
  RISEEdr = 'rise-edr',

  SNOTELEdr = 'snotel-edr',
  AWDB = 'awdb-forecasts-edr',

  USACEEdr = 'usace-edr',

  NWMChannelRouting = 'National_Water_Model_Channel_Routing_Output',
  NWMAssimilationSystem = 'National_Water_Model_Land_Data_Assimilation_System_Output',
  NWMReachToReach = 'National_Water_Data_Reach_to_Reach_Routing_Output',
  NWMLakeOutput = 'National_Water_Model_Lakeout',
  NWMGroundwaterOutput = 'National_Water_Model_Groundwater_Output',

  ArizonaWaterWells = 'ArizonaWaterWells',
  ActiveManagementAreas = 'Active_Management_Areas_2025',
  GroundwaterBasins = 'Arizona_Groundwater_Basins',
  IrrigationDistricts = 'ArizonaIrrigationDistricts',

  NOAARFC = 'noaa-rfc',
  NOAARiverStageForecastDay1 = 'noaa-river-stage-forecast-day-1',
  NOAARiverStageForecastDay2 = 'noaa-river-stage-forecast-day-2',
  NOAARiverStageForecastDay3 = 'noaa-river-stage-forecast-day-3',
  NOAARiverStageForecastDay10 = 'noaa-river-stage-forecast-day-10',

  PRISM = 'usgs-prism',
  NationalMapElevation = 'usgs-national-map_elevation',
  NationalMapLandCover = 'usgs-national-map_land-cover',
  Streamgages = 'usgs-sta',
  Aquifers = 'Aquifers_USGS_West',

  CentralArizonaProjectCanal = 'CentralArizonaProjectCanal',

  GRACEGroundwaterStorage = 'ASU_LCRB_GRACE',
  GRACEGroundwaterBasins = 'ASU_Groundwater_Basins_Aggregated_Grace',
  GRACE = 'GRACE',
  SMAP = 'SMAP_SPL4SMGP',
}

export enum Provider {
  ADWR = 'adwr',
  ASU = 'asu',
  CAP = 'cap',
  NASA = 'nasa',
  NOAA = 'noaa',
  USACE = 'usace',
  USBR = 'usbr',
  USDA = 'usda',
  USGS = 'usgs',
}

export const ProviderDatasources: Record<Provider, string[]> = {
  [Provider.ASU]: [CollectionId.GRACEGroundwaterBasins, CollectionId.GRACEGroundwaterStorage],
  [Provider.USBR]: [CollectionId.RISEEdr],
  [Provider.USDA]: [CollectionId.SNOTELEdr, CollectionId.AWDB],
  [Provider.USGS]: [
    CollectionId.PRISM,
    CollectionId.NationalMapElevation,
    CollectionId.NationalMapLandCover,
    CollectionId.Streamgages,
    CollectionId.Aquifers,
  ],
  [Provider.USACE]: [CollectionId.USACEEdr],
  [Provider.NOAA]: [
    CollectionId.NWMChannelRouting,
    CollectionId.NWMAssimilationSystem,
    CollectionId.NWMReachToReach,
    CollectionId.NWMLakeOutput,
    CollectionId.NWMGroundwaterOutput,
    CollectionId.NOAARFC,
    CollectionId.NOAARiverStageForecastDay1,
    CollectionId.NOAARiverStageForecastDay2,
    CollectionId.NOAARiverStageForecastDay3,
    CollectionId.NOAARiverStageForecastDay10,
  ],
  [Provider.NASA]: [CollectionId.SMAP],
  [Provider.ADWR]: [
    CollectionId.ArizonaWaterWells,
    CollectionId.ActiveManagementAreas,
    CollectionId.GroundwaterBasins,
    CollectionId.IrrigationDistricts,
  ],
  [Provider.CAP]: [CollectionId.CentralArizonaProjectCanal],
};

export const idStoreProperty = 'id_store';

// These feature collections have feature identifiers not compatible with Mapbox
export const StringIdentifierCollections: string[] = [
  CollectionId.AWDB,
  CollectionId.ArizonaWaterWells,
  CollectionId.NWMLakeOutput,
  CollectionId.Streamgages,
  CollectionId.SNOTELEdr,
  CollectionId.NOAARFC,
];

// These collections have a locations edge but doesnt support bbox
export const ItemsOnlyCollections: string[] = [];

// Some collections support locations but the data size is too large to reasonably render
export const DatasourceCollectionType: Record<CollectionType, string[]> = {
  [CollectionType.EDRGrid]: [
    CollectionId.NWMChannelRouting,
    CollectionId.NWMAssimilationSystem,
    CollectionId.NWMReachToReach,
    CollectionId.NWMLakeOutput,
    CollectionId.NWMGroundwaterOutput,
  ],
  [CollectionType.EDR]: [],
  [CollectionType.Features]: [],
  [CollectionType.Map]: [],
  [CollectionType.Unknown]: [],
};

export enum RestrictionType {
  Size = 'size',
  Day = 'day',
  Parameter = 'parameter', // Limit number of parameters
  ParameterFirst = 'parameter-first', // Select a parameter before fetch
  DateRange = 'date-range',
}

type RestrictionBase = {
  type: RestrictionType;
  message: string;
  noWarning?: boolean;
};

type SizeRestriction = RestrictionBase & {
  type: RestrictionType.Size;
  size: number;
};
type DayRestriction = RestrictionBase & {
  type: RestrictionType.Day;
  days: number;
};
type ParameterRestriction = RestrictionBase & {
  type: RestrictionType.Parameter;
  count: number;
};
type ParameterFirstRestriction = RestrictionBase & {
  type: RestrictionType.ParameterFirst;
};
type DateRangeRestriction = RestrictionBase & {
  type: RestrictionType.DateRange;
  days: number;
};
export type Restiction =
  | SizeRestriction
  | DayRestriction
  | ParameterRestriction
  | ParameterFirstRestriction
  | DateRangeRestriction;

export const CollectionRestrictions: Record<string, Restiction[]> = {
  [CollectionId.ArizonaWaterWells]: [
    {
      type: RestrictionType.Size,
      size: 83700000000,
      message: "Draw a polygon that's roughly 1/4th of Arizona.",
    },
  ],
  [CollectionId.NWMAssimilationSystem]: [
    // {
    //   type: RestrictionType.Size,
    //   size: 41900000000,
    //   message: "Draw a polygon that's roughly 1/8th of Arizona.",
    // },
    {
      type: RestrictionType.Day,
      days: 1,
      message: 'Select a date range no greater than one day.',
    },
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
  [CollectionId.NWMReachToReach]: [
    {
      type: RestrictionType.Size,
      size: 41900000000,
      message: "Draw a polygon that's roughly 1/8th of Arizona.",
    },
    {
      type: RestrictionType.Day,
      days: 1,
      message: 'Select a date range no greater than one day.',
    },
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
  [CollectionId.NWMChannelRouting]: [
    {
      type: RestrictionType.Size,
      size: 41900000000,
      message: "Draw a polygon that's roughly 1/8th of Arizona.",
    },
    {
      type: RestrictionType.Day,
      days: 1,
      message: 'Select a date range no greater than one day.',
    },
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
  [CollectionId.NWMGroundwaterOutput]: [
    {
      type: RestrictionType.Day,
      days: 7,
      message: 'Select a date range no greater than one week.',
    },
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
  [CollectionId.NWMLakeOutput]: [
    {
      type: RestrictionType.Day,
      days: 7,
      message: 'Select a date range no greater than one week.',
    },
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
  [CollectionId.PRISM]: [
    {
      type: RestrictionType.Day,
      days: 1095,
      message: 'Select a date range no greater than three years.',
    },
  ],
  [CollectionId.GRACE]: [
    {
      type: RestrictionType.Parameter,
      count: 1,
      message: 'Select only one parameter.',
    },
  ],
};

export const CollectionDefaultLabels: Record<string, string> = {};
