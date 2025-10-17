/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Stack, Title } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';

export const Header: React.FC = () => {
  return (
    <Stack id="header-wrapper" justify="center" align="center" className={styles.headerWrapper}>
      {/* TODO: modularize */}
      <Box w="80%" h="50px" style={{ backgroundColor: 'pink' }} className={styles.logo}>
        Logo Placeholder
      </Box>
      <Title order={1} size="h2" className={styles.title}>
        Arizona Water Observatory
      </Title>
    </Stack>
  );
};
