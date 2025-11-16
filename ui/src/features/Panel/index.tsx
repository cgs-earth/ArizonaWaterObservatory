/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { ActionIcon, Box, Collapse, Group, Overlay, Stack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import Menu from '@/assets/Menu';
import X from '@/assets/X';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import Datasets from '@/features/Panel/Datasets';
import { Header } from '@/features/Panel/Header';
import Layers from '@/features/Panel/Layers';
import styles from '@/features/Panel/Panel.module.css';
import { Toggle } from '@/features/Panel/Toggle';
import { Mobile } from '@/features/TopBar/Mobile';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { ClearAll } from './ClearAll';

const Panel: React.FC = () => {
  const mobile = useMediaQuery('(max-width: 899px)');

  const [opened, { toggle, open, close }] = useDisclosure(true);

  const getCollections = async () => {
    const loadingInstance = loadingManager.add('Updating collections', LoadingType.Collections);
    try {
      await mainManager.getCollections();
      notificationManager.show('Updated collections', NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    void getCollections();
  }, []);

  useEffect(() => {
    if (mobile) {
      open();
    }
  }, [mobile, open]);

  return (
    <>
      {mobile && (
        <IconButton
          size="lg"
          variant={Variant.Secondary}
          className={styles.mobileOpen}
          onClick={open}
        >
          <Menu />
        </IconButton>
      )}
      <Box className={styles.panelWrapper}>
        <Group gap={0} align="flex-start" className={styles.panelGroup} wrap="nowrap">
          <Collapse
            in={opened}
            transitionDuration={0}
            className={`${styles.panelBody} ${opened ? styles.panelOpen : styles.panelClosed}`}
          >
            <Stack gap={0} align="center" className={styles.panelContent}>
              <ActionIcon
                size="sm"
                variant="transparent"
                onClick={close}
                classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
                className={styles.mobileClose}
              >
                <X />
              </ActionIcon>
              <Header />
              <Box className={styles.accordions}>
                <Datasets />
                <Layers />
              </Box>
              <Group justify="space-between" align="flex-start" w="100%">
                <ClearAll />
                <Mobile />
              </Group>
            </Stack>
          </Collapse>

          <Toggle open={opened} setOpen={toggle} />
        </Group>
      </Box>
      {mobile && opened && <Overlay zIndex={198} color="#000" backgroundOpacity={0.7} />}
    </>
  );
};

export default Panel;
