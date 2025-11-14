/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Collapse, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Tools from '@/assets/Tools';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import BasemapSelector from '@/features/Tools/Basemap';
import { Draw } from '@/features/Tools/Draw';
import { Geocoder } from '@/features/Tools/Geocoder';
import Legend from '@/features/Tools/Legend';
import styles from '@/features/Tools/Tools.module.css';
import { Warning } from '@/features/Tools/Warning';

export const Mobile: React.FC = () => {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Box className={styles.mobileWrapper}>
      <IconButton variant={opened ? Variant.Selected : Variant.Secondary} onClick={toggle}>
        <Tools />
      </IconButton>
      <Collapse in={opened}>
        <Stack mt="var(--default-spacing)" align="flex-end" justify="flex-end">
          <Geocoder />
          <Legend />
          <BasemapSelector />
          <Draw />
          <Warning />
        </Stack>
      </Collapse>
    </Box>
  );
};
