/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

export enum CollectionId {
  RISEEdr = 'rise-edr',
  SNOTELEdr = 'snotel-edr',
  USACEEdr = 'usace-edr',
  Streamgages = 'usgs-sta',
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
