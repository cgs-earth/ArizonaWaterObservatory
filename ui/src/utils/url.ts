/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { BBox, Feature } from 'geojson';
import { ICollection } from '@/services/edr.service';
import { Location } from '@/stores/main/types';

export const getDatetime = (
  from: string | null | undefined,
  to: string | null | undefined
): string | null => {
  if (from && to) {
    return `${from}/${to}`;
  } else if (from) {
    return `${from}/..`;
  } else if (to) {
    return `../${to}`;
  }
  return null;
};

export const buildLocationUrl = (
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

const normalizeBBox = (bbox: BBox) => {
  const [x1, y1, x2, y2] = bbox;

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return [minX, minY, maxX, maxY];
};

export const buildCubeUrl = (
  collectionId: ICollection['id'],
  feature: Feature,
  parameters: string[],
  from: string | null,
  to: string | null,
  csv: boolean = false,
  format: boolean = true
): string => {
  if (!feature.bbox) {
    return '';
  }

  const url = new URL(`${import.meta.env.VITE_AWO_SOURCE}/collections/${collectionId}/cube`);
  url.searchParams.set('bbox', normalizeBBox(feature.bbox).join(','));

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
