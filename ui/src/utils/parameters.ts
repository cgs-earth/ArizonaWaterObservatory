/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionId } from '@/consts/collections';
import { ICollection } from '@/services/edr.service';

const getParameters = (collection: ICollection) => {
  return Object.values(collection.parameter_names)
    .slice(0, 5)
    .map((parameterName) => parameterName.name);
};

export const getParameterList = (collection: ICollection): string[] => {
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

  return getParameters(collection);
};
