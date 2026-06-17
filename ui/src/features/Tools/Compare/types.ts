/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Parameter } from '@/features/Popup';
import { Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';

export type TSimplifiedEntry = {
  layer: Layer;
  collectionType: CollectionType;
  parameters: Parameter[];
  locations: string[];
};
