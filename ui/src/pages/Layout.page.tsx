/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Group, Stack } from '@mantine/core';
import { useMap } from '@/contexts/MapContexts';
import Loading from '@/features/Loading';
import { MAP_ID } from '@/features/Map/config';
import Notifications from '@/features/Notifications';
import Panel from '@/features/Panel';
import TopBar from '@/features/TopBar';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import styles from '@/pages/pages.module.css';
import useMainStore from '@/stores/main';
import { LoadingType, NotificationType } from '@/stores/session/types';

export const LayoutPage: React.FC = () => {
  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const setShareId = useMainStore((state) => state.setShareId);
  const setConfigGenerated = useMainStore((state) => state.setConfigGenerated);

  const { map } = useMap(MAP_ID);

  const loadConfig = async (shareId: string) => {
    const loadingInstance = loadingManager.add('Loading shared config', LoadingType.Share);
    try {
      controller.current = new AbortController();
      const { success, response } = await mainManager.getConfig(shareId, controller.current.signal);
      if (success) {
        if (!(typeof response === 'string')) {
          const loaded = await mainManager.loadConfig(response);
          if (loaded) {
            notificationManager.show(
              'Shared configuration loaded successfully.',
              NotificationType.Success
            );
            setShareId(shareId);
            setConfigGenerated(true);
          } else {
            notificationManager.show('Unable to load config.', NotificationType.Error);
          }
        }
      } else if (typeof response === 'string') {
        notificationManager.show(response, NotificationType.Error);
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }
    const queryParams = new URLSearchParams(window.location.search);
    const shareId = queryParams.get('shareId');

    if (shareId) {
      void loadConfig(shareId);
    }
  }, [map]);

  return (
    <Box className={styles.root}>
      <Stack gap={0} className={styles.fullHeight}>
        <Group gap={0} align="flex-start" className={styles.fullHeight}>
          <Panel />
          <Stack gap={0} className={styles.right}>
            <TopBar />
            <Loading desktop={false} />
            <Outlet />
          </Stack>
        </Group>
        <Loading desktop />
      </Stack>
      <Notifications />
    </Box>
  );
};
