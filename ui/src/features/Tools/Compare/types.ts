/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Parameter } from '@/features/Popup';
import { Layer } from '@/stores/main/types';

export type TSimplifiedEntry = {
  layer: Layer;
  parameters: Parameter[];
  locations: string[];
};
