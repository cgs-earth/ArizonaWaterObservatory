/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Outlet } from 'react-router-dom';
import { Box, Group, Stack } from '@mantine/core';
import Panel from '@/features/Panel';
import TopBar from '@/features/TopBar';
import styles from '@/pages/pages.module.css';

export const LayoutPage: React.FC = () => {
  return (
    <Box className={styles.root}>
      <Group gap={0} align="flex-start">
        <Panel />
        <Stack gap={0} className={styles.right}>
          <TopBar />
          <Outlet />
        </Stack>
      </Group>
    </Box>
  );
};
