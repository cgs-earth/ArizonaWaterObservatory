/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Box, Collapse, Group, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Datasets from '@/features/Panel/Datasets';
import { Header } from '@/features/Panel/Header';
import Layers from '@/features/Panel/Layers';
import styles from '@/features/Panel/Panel.module.css';
import { Toggle } from '@/features/Panel/Toggle';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import useMainStore from '@/stores/main';
import { LoadingType, NotificationType } from '@/stores/session/types';

const Panel: React.FC = () => {
  const provider = useMainStore((state) => state.provider);
  const category = useMainStore((state) => state.category);

  const [opened, { toggle }] = useDisclosure(true);

  const getCollections = async () => {
    const loadingInstance = loadingManager.add('Updating collections', LoadingType.Collections);
    try {
      await mainManager.getCollections();
      loadingManager.remove(loadingInstance);
      notificationManager.show('Updated collections', NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    void getCollections();
  }, [provider, category]);

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
            <Box className={styles.accordions}>
              <Datasets />
              <Layers />
            </Box>
          </Stack>
        </Collapse>

        <Toggle open={opened} setOpen={toggle} />
      </Group>
    </Box>
  );
};

export default Panel;
