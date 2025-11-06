/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import { Variant } from '@/components/types';
import Tools from '@/features/Tools';
import Info from '@/features/TopBar/Info';
import Links from '@/features/TopBar/Links';
import Share from '@/features/TopBar/Share';
import styles from '@/features/TopBar/TopBar.module.css';

const TopBar: React.FC = () => {
  return (
    <Group justify="space-between" className={styles.topBarWrapper}>
      <Group>
        <Info />
        <Share />
        <Links />
        <Tooltip label="Feature in development">
          <Button disabled data-disabled size="sm" w="fit-content" variant={Variant.Secondary}>
            Download
          </Button>
        </Tooltip>
      </Group>
      <Tools />
    </Group>
  );
};

export default TopBar;
