/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import {
  ActionIcon,
  Box,
  Collapse,
  Group,
  Overlay,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import Menu from '@/assets/Menu';
import X from '@/assets/X';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import { ClearAll } from '@/features/Panel/ClearAll';
import Datasets from '@/features/Panel/Datasets';
import { Header } from '@/features/Panel/Header';
import Layers from '@/features/Panel/Layers';
import Locations from '@/features/Panel/Locations';
import styles from '@/features/Panel/Panel.module.css';
import { Toggle } from '@/features/Panel/Toggle';
import { Mobile } from '@/features/TopBar/Mobile';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import useMainStore from '@/stores/main';
import { LoadingType, NotificationType } from '@/stores/session/types';

const Panel: React.FC = () => {
  const mobile = useMediaQuery('(max-width: 899px)');

  const [opened, { toggle, open, close }] = useDisclosure(true);

  const layerCount = useMainStore((state) => state.layers.length);
  const hasLayers = layerCount > 0;

  const getCollections = async () => {
    const loadingInstance = loadingManager.add('Fetching all datasets.', LoadingType.Collections);
    try {
      await mainManager.getCollections();
      notificationManager.show('Updated datasets', NotificationType.Success);
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

  const datasetsHelpText = (
    <>
      <Text size="sm">Datasets are collections of scientific measurements.</Text>
      <br />
      <Text size="sm">
        Click the "+" button to create a layer from a dataset and start interacting <br /> with the
        data on the map or in application tools.
      </Text>
    </>
  );

  const layerHelpText = (
    <>
      <Text size="sm">Layers are customizable instances of a dataset.</Text>
      <br />
      <Text size="sm">
        Add one or more instances of a dataset, then <br />
        customize it here. Filter locations by parameter, relabel/recolor the layer,
        <br /> and set a default date range for data exports.
      </Text>
    </>
  );

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
                <Tabs defaultValue="datasets" color="var(--asu-color-primary)">
                  <Tabs.List className={styles.tabsList}>
                    <Tabs.Tab value="datasets">
                      <Tooltip label={datasetsHelpText} openDelay={500} zIndex={302}>
                        <Title order={2} size={mobile ? 'h4' : 'h3'} className={styles.title}>
                          Datasets
                        </Title>
                      </Tooltip>
                    </Tabs.Tab>
                    <Tabs.Tab value="layers" disabled={!hasLayers}>
                      <Tooltip label={layerHelpText} openDelay={500} zIndex={302}>
                        <Group gap="var(--default-spacing)">
                          <Title order={2} size={mobile ? 'h4' : 'h3'} className={styles.title}>
                            Layers
                          </Title>
                          {layerCount > 0 && (
                            <Box className={styles.indicator}>
                              <Text size="sm">{layerCount}</Text>
                            </Box>
                          )}
                        </Group>
                      </Tooltip>
                    </Tabs.Tab>
                  </Tabs.List>
                  <Tabs.Panel value="datasets">
                    <Datasets />
                  </Tabs.Panel>
                  <Tabs.Panel value="layers">
                    <Layers />
                  </Tabs.Panel>
                </Tabs>
              </Box>
              <Group
                justify="space-between"
                align="flex-start"
                w="100%"
                my="calc(var(--default-spacing) * 2)"
              >
                <ClearAll />
                {hasLayers && <Locations />}
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
