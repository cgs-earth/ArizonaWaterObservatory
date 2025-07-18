/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';

export default {
  title: 'DateInput',
};

export const Usage = () => (
  <DateInput label="Input label" description="Input description" placeholder="Input placeholder" />
);

export const Presets = () => (
  <DateInput
    label="Input label"
    description="Input description"
    placeholder="Input placeholder"
    simplePresets={[
      DatePreset.OneYear,
      DatePreset.FiveYears,
      DatePreset.TenYears,
      DatePreset.FifteenYears,
      DatePreset.ThirtyYears,
    ]}
  />
);
