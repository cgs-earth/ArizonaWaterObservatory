/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ICollection } from '@/services/edr.service';
import { MainState } from '@/stores/main/types';
import { getProvider } from './provider';

export const filterCollections = (
  collections: MainState['collections'],
  provider: MainState['provider'],
  category: MainState['category'],
  parameterGroupMembers: MainState['parameterGroupMembers']
) => {
  const filterFunctions: Array<(collection: ICollection) => boolean> = [];
  if (category) {
    const categoryMembers = parameterGroupMembers[category.value];
    filterFunctions.push((collection) => categoryMembers.includes(collection.id));
  }

  if (provider && provider.length > 0) {
    filterFunctions.push((collection) => getProvider(collection.id) === provider);
  }

  return collections.filter(
    (collection) =>
      filterFunctions.length === 0 || filterFunctions.every((filter) => filter(collection))
  );
};
