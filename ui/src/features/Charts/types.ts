/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRequestParams } from '@ogcapi-js/shared';
import { ComboboxItem } from '@mantine/core';
import { CoverageCollection, CoverageJSON, ICollection } from '@/services/edr.service';
import { Location } from '@/stores/main/types';

export enum ETabTypes {
  Unit = 'unit',
  Parameter = 'parameter',
}

export type TTypedOption = ComboboxItem & {
  type: ETabTypes;
};

export type TWrappedCoverage = {
  data: CoverageCollection | CoverageJSON;
  label?: string;
  locationId: Location['id'];
  params: IRequestParams;
  collectionId: ICollection['id'];
  createdAt: number;
};

export type TCoverageLabel =
  | Record<string, string>
  | ((args: {
      locationId: Location['id'];
      index: number; // index into locationIds
      coverage: CoverageCollection | CoverageJSON;
    }) => string);
