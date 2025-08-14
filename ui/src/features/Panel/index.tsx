/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Collapse, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Datasets from '@/features/Panel/Datasets';
import { Header } from '@/features/Panel/Header';
import Layers from '@/features/Panel/Layers';
import styles from '@/features/Panel/Panel.module.css';
import { Toggle } from '@/features/Panel/Toggle';

const Panel: React.FC = () => {
  const [opened, { toggle }] = useDisclosure(true);

  return (
    <Box className={styles.panelWrapper}>
      <Group gap={0} align="flex-start" className={styles.panelGroup} wrap="nowrap">
        <Collapse
          in={opened}
          transitionDuration={0}
          className={`${styles.panelBody} ${opened ? styles.panelOpen : styles.panelClosed}`}
        >
          <Stack gap={0}>
            <Header />
            <Datasets />
            <Layers />
          </Stack>
        </Collapse>

        <Toggle open={opened} setOpen={toggle} />
      </Group>
    </Box>
  );
};

export default Panel;
