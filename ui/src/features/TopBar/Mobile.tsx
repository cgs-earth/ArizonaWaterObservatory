/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import Info from '@/features/TopBar/Info';
import Links from '@/features/TopBar/Links';
import Share from '@/features/TopBar/Share';
import styles from '@/features/TopBar/TopBar.module.css';

export const Mobile: React.FC = () => {
  return (
    <Group className={styles.mobileWrapper}>
      <Info />
      <Share />
      <Links />
    </Group>
  );
};
