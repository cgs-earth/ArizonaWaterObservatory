/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flex, Group, Stack, Text } from '@mantine/core';
import Square from '@/assets/Square';
import styles from '@/features/Tools/Tools.module.css';
import { LegendEntry } from '@/stores/session/types';

type Props = {
  color: LegendEntry['color'];
  direction?: 'row' | 'column';
};

export const Grid: React.FC<Props> = (props) => {
  const { color, direction = 'row' } = props;

  <Group gap="xs" justify="flex-start" align="flex-start">
    <Stack className={styles.legendContrast} gap="xs">
      <Square fill={color} />
      <Square fill={color} stroke="#fff" />
    </Stack>
    <Stack gap={10} pt="var(--default-spacing)" mt={0} align="flex-start">
      <Text size="xs">Grid Spaces</Text>
      <Stack gap={0}>
        <Text size="xs">Selected Grid Spaces</Text>
      </Stack>
    </Stack>
  </Group>;

  return (
    <Flex
      className={direction === 'row' ? styles.row : styles.column}
      justify="flex-start"
      align="flex-start"
      gap="var(--default-spacing)"
    >
      <Flex
        className={`${styles.legendContrast} ${direction === 'row' ? styles.column : styles.row}`}
        gap="calc(var(--default-spacing) * 1.5)"
      >
        <Square fill={color} /> <Square fill={color} stroke="#fff" />
      </Flex>
      <Flex
        className={`${styles.labelColumn} ${direction === 'row' ? styles.column : styles.row}`}
        gap="calc(var(--default-spacing) * 2.5)"
        align="flex-start"
        mt={8}
      >
        <Text size="xs">Grid Spaces</Text>
        <Text size="xs">Selected Grid Spaces</Text>
      </Flex>
    </Flex>
  );
};
