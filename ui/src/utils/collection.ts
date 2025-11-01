/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ICollection } from '@/services/edr.service';

// This is non-exhaustive, reflects currently supported types
export enum CollectionType {
  EDR = 'edr',
  EDRGrid = 'edr-grid',
  Features = 'features',
  Unknown = 'unknown',
}

export const isEdr = (collection: ICollection): boolean => {
  return Object.keys(collection.data_queries).some((query) => query === 'locations');
};

export const isEdrGrid = (collection: ICollection): boolean => {
  const queries = Object.keys(collection.data_queries);
  return (
    queries.every((query) => query !== 'locations') &&
    queries.some((query) => query === 'position') &&
    queries.some((query) => query === 'cube')
  );
};

export const isFeatures = (collection: ICollection): boolean => {
  const queries = Object.keys(collection.data_queries);
  return (
    queries.every((query) => query !== 'locations') && queries.some((query) => query === 'items')
  );
};

export const getCollectionType = (collection: ICollection): CollectionType => {
  if (isEdr(collection)) {
    return CollectionType.EDR;
  }

  if (isEdrGrid(collection)) {
    return CollectionType.EDRGrid;
  }

  if (isFeatures(collection)) {
    return CollectionType.EDRGrid;
  }

  return CollectionType.Unknown;
};
