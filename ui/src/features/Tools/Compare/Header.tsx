/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, Title } from '@mantine/core';
import Reset from '@/assets/Reset';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import IconButton from '@/components/IconButton';
import styles from '@/features/Tools/Compare/Compare.module.css';

type Props = {
  from: string;
  onFromChange: (from: string) => void;
  to: string;
  onToChange: (to: string) => void;
  onReset: () => void;
};

export const Header: React.FC<Props> = (props) => {
  const { from, onFromChange, to, onToChange, onReset } = props;

  return (
    <Group className={styles.header} align="center">
      <Title order={5} size="h2" p="var(--default-spacing)">
        Compare
      </Title>
      <Group gap="calc(var(--default-spacing) * 2)" align="flex-end">
        <DateInput
          label="From"
          size="xs"
          className={styles.datePicker}
          placeholder="Pick start date"
          value={from}
          onChange={(value) => {
            if (value) {
              onFromChange(value);
            }
          }}
          simplePresets={[
            DatePreset.OneYear,
            DatePreset.FiveYears,
            DatePreset.TenYears,
            DatePreset.FifteenYears,
            DatePreset.ThirtyYears,
          ]}
        />
        <DateInput
          label="To"
          size="xs"
          className={styles.datePicker}
          placeholder="Pick end date"
          value={to}
          onChange={(value) => {
            if (value) {
              onToChange(value);
            }
          }}
          simplePresets={[
            DatePreset.OneYear,
            DatePreset.FiveYears,
            DatePreset.TenYears,
            DatePreset.FifteenYears,
            DatePreset.ThirtyYears,
          ]}
        />
      </Group>
      <IconButton onClick={onReset}>
        <Reset />
      </IconButton>
    </Group>
  );
};
