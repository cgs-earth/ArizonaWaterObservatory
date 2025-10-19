/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionId } from '@/consts/collections';
import { ICollection } from '@/services/edr.service';

export const getProvider = (collectionId: ICollection['id']): string => {
  switch (collectionId) {
    case CollectionId.RISEEdr:
      return 'USBR';
    case CollectionId.SNOTELEdr:
      return 'USDA';
    case CollectionId.Streamgages:
      return 'USGS';
    case CollectionId.USACEEdr:
      return 'USACE';
    default:
      return '';
  }
};
