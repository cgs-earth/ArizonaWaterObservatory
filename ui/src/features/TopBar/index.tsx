/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import Tools from '@/features/Tools';
import styles from '@/features/TopBar/TopBar.module.css';
import Links from './Links';
import Share from './Share';

const TopBar: React.FC = () => {
  return (
    <Group justify="space-between" className={styles.topBarWrapper}>
      <Group>
        <Share />
        <Links />
      </Group>
      <Tools />
    </Group>
  );
};

export default TopBar;
