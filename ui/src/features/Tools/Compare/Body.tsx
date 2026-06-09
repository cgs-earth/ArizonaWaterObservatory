/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, Stack } from '@mantine/core';
import styles from '@/features/Tools/Compare/Compare.module.css';
import Panel from './Panel';

export const Body: React.FC = () => {
  return (
    <Stack className={styles.body} p={0}>
      <Group h="100%">
        <Panel />
        Test 2
      </Group>
    </Stack>
  );
};
