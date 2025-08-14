/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Text } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';

export const Fallback: React.FC = () => {
  return (
    <Box className={styles.fallbackWrapper}>
      <Text size="lg" ta="center">
        Select a Dataset to begin interacting with the data
      </Text>
    </Box>
  );
};
