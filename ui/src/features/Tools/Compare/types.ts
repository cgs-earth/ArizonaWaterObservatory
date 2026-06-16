/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Parameter } from '@/features/Popup';

export type TSimplifiedEntry = {
  layerId: string;
  datasourceId: string;
  name: string;
  parameters: Parameter[];
  locations: string[];
};
