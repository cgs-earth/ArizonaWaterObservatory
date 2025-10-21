/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Group, Select, Stack, Text, Title, Tooltip, VisuallyHidden } from '@mantine/core';
import Info from '@/assets/Info';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import { MainState } from '@/stores/main/types';

type Props = {
  provider: MainState['provider'];
  onChange: (provider: MainState['provider']) => void;
};

export const Provider: React.FC<Props> = (props) => {
  const { provider, onChange } = props;

  const helpText = (
    <>
      <Text size="sm">
        Select a data provider to explore the categories and datasets they've published.
      </Text>
      <br />
      <Text size="sm">This filters results based on the source of the data.</Text>
    </>
  );

  return (
    <Stack gap={0}>
      <Select
        size="sm"
        label={
          <>
            <Tooltip multiline label={helpText}>
              <Group className={styles.filterTitleWrapper} gap="xs">
                <Title order={6} size="h4">
                  Data Provider
                </Title>
                <Info />
              </Group>
            </Tooltip>
            <VisuallyHidden>{helpText}</VisuallyHidden>
          </>
        }
        placeholder="Select..."
        data={['USACE', 'USDA', 'USBR', 'USGS']}
        value={provider}
        onChange={onChange}
        searchable
        clearable
      />
    </Stack>
  );
};
