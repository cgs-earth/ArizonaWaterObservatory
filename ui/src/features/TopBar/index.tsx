/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import Button from '@/components/Button';
import Tools from '@/features/Tools';
import styles from '@/features/TopBar/TopBar.module.css';

const TopBar: React.FC = () => {
  return (
    <Group justify="space-between" className={styles.topBarWrapper}>
      <Group>
        <Button size="sm">Placeholder</Button>
      </Group>
      <Tools />
    </Group>
  );
};

export default TopBar;
