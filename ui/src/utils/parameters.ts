/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionId } from '@/consts/collections';
import { ICollection } from '@/services/edr.service';

const getParameters = (collection: ICollection, limit: number = 5) => {
  if (limit < 0) {
    return Object.values(collection.parameter_names).map((parameterName) => parameterName.name);
  }
  let _limit = limit;
  if (limit > 50) {
    _limit = 50;
  }

  return Object.values(collection.parameter_names)
    .slice(0, _limit)
    .map((parameterName) => parameterName.name);
};

export const getParameterList = (collection: ICollection, limit: number = 5): string[] => {
  switch (collection.id) {
    case CollectionId.RISEEdr:
      return [
        'Lake/Reservoir Storage',
        'Lake/Reservoir Area',
        'Air Temperature',
        'Precipitation',
        'Stream Gage Height',
      ];
  }

  return getParameters(collection, limit);
};
