/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ICollection } from '@/services/edr.service';
import { Location } from '@/stores/main/types';

export const getDatetime = (from: string | null, to: string | null): string | null => {
  if (from && to) {
    return `${from}/${to}`;
  } else if (from) {
    return `${from}/..`;
  } else if (to) {
    return `../${to}`;
  }
  return null;
};

export const buildUrl = (
  collectionId: ICollection['id'],
  locationId: Location['id'],
  parameters: string[],
  from: string | null,
  to: string | null,
  csv: boolean = false,
  format: boolean = true
): string => {
  const url = new URL(
    `${import.meta.env.VITE_AWO_SOURCE}/collections/${collectionId}/locations/${locationId}`
  );

  if (format) {
    url.searchParams.set('f', csv ? 'csv' : 'json');
  }

  if (parameters.length > 0) {
    url.searchParams.set('parameter-name', parameters.join(','));
  }

  const datetime = getDatetime(from, to);

  if (datetime) {
    url.searchParams.set('datetime', datetime);
  }

  return url.toString();
};
