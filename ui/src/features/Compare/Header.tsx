/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Title } from '@mantine/core';
import Reset from '@/assets/Reset';
import Button from '@/components/Button';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import styles from '@/features/Compare/Compare.module.css';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import { FullscreenButton } from './Data/FullscreenButton';

type Props = {
  from: string;
  to: string;
  element: HTMLDivElement | null;
  onDateUpdate: (from: string, to: string) => void;
  onReset: () => void;
};

export const Header: React.FC<Props> = (props) => {
  const { from, to, element, onDateUpdate, onReset } = props;

  const [tempFrom, setTempFrom] = useState(from);
  const [tempTo, setTempTo] = useState(to);

  const { getDateInputError } = useLayerValidation(undefined, false, {
    from: tempFrom,
    to: tempTo,
  });

  useEffect(() => {
    setTempFrom(from);
  }, [from]);

  useEffect(() => {
    setTempTo(to);
  }, [to]);

  const dateInputError = getDateInputError();

  return (
    <Group className={styles.header} align="center">
      <Title order={5} size="h2" p="var(--default-spacing)">
        Compare
      </Title>
      <Group justify="space-between" className={styles.headerControls}>
        <Group gap="var(--default-spacing)" align="flex-end">
          <Group gap="calc(var(--default-spacing) * 2)">
            <DateInput
              label="From"
              size="xs"
              className={styles.datePicker}
              placeholder="Pick start date"
              value={tempFrom}
              onChange={(value) => {
                if (value) {
                  setTempFrom(value);
                }
              }}
              simplePresets={[
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              error={dateInputError}
            />
            <DateInput
              label="To"
              size="xs"
              className={styles.datePicker}
              placeholder="Pick end date"
              value={tempTo}
              onChange={(value) => {
                if (value) {
                  setTempTo(value);
                }
              }}
              simplePresets={[
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              error={dateInputError}
            />
          </Group>
          <Button
            variant={Variant.Primary}
            size="xs"
            mb={dateInputError ? '1.1rem' : '0.12rem'}
            onClick={() => onDateUpdate(tempFrom, tempTo)}
            disabled={(from === tempFrom && to === tempTo) || Boolean(dateInputError)}
          >
            Update
          </Button>
        </Group>
        <Group gap="var(--default-spacing)">
          <IconButton onClick={onReset}>
            <Reset />
          </IconButton>
          {element && <FullscreenButton element={element} />}
        </Group>
      </Group>
    </Group>
  );
};
