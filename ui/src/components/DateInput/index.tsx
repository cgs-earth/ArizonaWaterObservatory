/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { DateInput as DateInputComponent, DateInputProps } from '@mantine/dates';
import styles from '@/components/DateInput/DateInput.module.css';
import { DatePreset } from '@/components/DateInput/DateInput.types';

// import { getSimplePresetDates } from '@/components/DateInput/utils';

type Props = DateInputProps & {
  simplePresets?: DatePreset[];
};

const DateInput: React.FC<Props> = (props) => {
  const { simplePresets, ...datePickerProps } = props;

  // Retaining this for future reference, remove when custom presets get implemented
  // const simplePresetDates = simplePresets ? getSimplePresetDates(simplePresets) : [];

  return (
    <DateInputComponent
      classNames={{ input: styles.input }}
      size="md"
      radius={0}
      valueFormat="MM/DD/YYYY"
      // presets={[...(presets ?? []), ...simplePresetDates]}
      {...datePickerProps}
    />
  );
};

export default DateInput;
