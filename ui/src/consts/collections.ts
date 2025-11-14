/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionType } from '@/utils/collection';

export enum CollectionId {
  RISEEdr = 'rise-edr',
  SNOTELEdr = 'snotel-edr',
  USACEEdr = 'usace-edr',
  Streamgages = 'usgs-sta',

  NWMChannelRouting = 'National_Water_Model_Channel_Routing_Output',
  NWMAssimilationSystem = 'National_Water_Model_Land_Data_Assimilation_System_Output',
  NWMReachToReach = 'National_Water_Data_Reach_to_Reach_Routing_Output',
  ArizonaWaterWells = 'ArizonaWaterWells',
}

export enum Provider {
  USBR = 'usbr',
  USDA = 'usda',
  USGS = 'usgs',
  USACE = 'usace',
}

export const ProviderDatasources: Record<Provider, string[]> = {
  [Provider.USBR]: [CollectionId.RISEEdr],
  [Provider.USDA]: [CollectionId.SNOTELEdr],
  [Provider.USGS]: [CollectionId.Streamgages],
  [Provider.USACE]: [CollectionId.USACEEdr],
};

// Some collections support locations but the data size is too large to reasonably render
export const DatasourceCollectionType: Record<CollectionType, string[]> = {
  [CollectionType.EDRGrid]: [CollectionId.NWMChannelRouting],
  [CollectionType.EDR]: [],
  [CollectionType.Features]: [],
  [CollectionType.Map]: [],
  [CollectionType.Unknown]: [],
};

export const CollectionRestrictions: Record<
  string,
  { size?: number; days?: number; message: string }
> = {
  [CollectionId.ArizonaWaterWells]: {
    size: 83700000000,
    message: "Try a polygon that's roughly 1/4th of Arizona.",
  },
  [CollectionId.NWMAssimilationSystem]: {
    size: 41900000000,
    days: 7,
    message: "Try a polygon that's roughly 1/8th of Arizona.",
  },
  [CollectionId.NWMReachToReach]: {
    size: 41900000000,
    days: 7,
    message: "Try a polygon that's roughly 1/8th of Arizona.",
  },
};
