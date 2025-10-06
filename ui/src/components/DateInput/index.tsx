/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatePickerInput, DatePickerInputProps } from '@mantine/dates';
import styles from '@/components/DateInput/DateInput.module.css';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import { getSimplePresetDates } from '@/components/DateInput/utils';

type Props = DatePickerInputProps & {
  simplePresets?: DatePreset[];
};

const DateInput: React.FC<Props> = (props) => {
  const { simplePresets, presets, ...datePickerProps } = props;

  const simplePresetDates = simplePresets ? getSimplePresetDates(simplePresets) : [];

  return (
    <DatePickerInput
      classNames={{ input: styles.input }}
      size="md"
      radius={0}
      presets={[...(presets ?? []), ...simplePresetDates]}
      {...datePickerProps}
    />
  );
};

export default DateInput;
