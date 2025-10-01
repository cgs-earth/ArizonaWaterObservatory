/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { DatePickerPreset } from '@mantine/dates';
import { DatePreset } from '@/components/DateInput/DateInput.types';

const getSimplePresetDate = (simplePreset: DatePreset): DatePickerPreset<'default'> => {
  switch (simplePreset) {
    case DatePreset.OneYear:
      return { value: dayjs().subtract(1, 'year').format('YYYY-MM-DD'), label: 'One year' };
    case DatePreset.FiveYears:
      return { value: dayjs().subtract(5, 'year').format('YYYY-MM-DD'), label: 'Five years' };
    case DatePreset.TenYears:
      return { value: dayjs().subtract(10, 'year').format('YYYY-MM-DD'), label: 'Ten years' };
    case DatePreset.FifteenYears:
      return { value: dayjs().subtract(15, 'year').format('YYYY-MM-DD'), label: 'Fifteen years' };
    case DatePreset.ThirtyYears:
      return { value: dayjs().subtract(30, 'year').format('YYYY-MM-DD'), label: 'Thirty years' };
  }
};

export const getSimplePresetDates = (
  simplePresets: DatePreset[]
): DatePickerPreset<'default'>[] => {
  const datePickerPresets: DatePickerPreset<'default'>[] = [];
  simplePresets.forEach((simplePreset) => {
    const datePickerPreset = getSimplePresetDate(simplePreset);
    datePickerPresets.push(datePickerPreset);
  });

  return datePickerPresets;
};
