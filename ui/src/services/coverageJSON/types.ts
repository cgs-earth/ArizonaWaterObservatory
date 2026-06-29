/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { EChartsSeries } from '@/components/Charts/types';
import { CoverageJSON } from '@/services/edr.service';

export type TValues = Record<string, (number | null)[]>;
export type TAxes = {
  t: { values: string[] };
  x: { start: number; stop: number; num: number };
  y: { start: number; stop: number; num: number };
};

export type TOptions = {
  chosenParameter?: string;
  chosenUnit?: string;
};

export type TCoverageOptions = TOptions & {
  parameters?: CoverageJSON['parameters'];
  axisStyle?: 'values' | 'time';
};

export type TFilteredRange = [
  string,
  {
    type: string;
    values: number[];
  },
];

// Stricter type than the Echarts union type
export type XAXisOption =
  | {
      type: 'category';
      boundaryGap?: boolean;
      data?: string[] | number[];
      name?: string;
      nameLocation?: string;
      nameGap?: number;
    }
  | {
      type: 'time';
      min?: string;
      max?: string;
    }
  | {
      type: 'unknown';
    };

export type TChartData = {
  x: XAXisOption;
  series: EChartsSeries[];
};
