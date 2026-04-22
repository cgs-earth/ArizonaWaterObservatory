/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Notification, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import styles from '@/features/Notifications/Notifications.module.css';
import notificationManager from '@/managers/Notification.init';
import useSessionStore from '@/stores/session';
import { NotificationVariant } from '@/stores/session/types';
import { History } from './History';

const Notifications: React.FC = () => {
  const notifications = useSessionStore((state) => state.notifications);

  const [opened, { open, close }] = useDisclosure(false);

  const getColor = (type: NotificationVariant) => {
    switch (type) {
      case NotificationVariant.Error:
        return 'red';
      case NotificationVariant.Success:
        return 'green';
      case NotificationVariant.Info:
      default:
        return undefined;
    }
  };

  const handleClick = (show: boolean) => {
    if (show) {
      open();
    } else {
      close();
    }
  };

  if (notifications.length === 0) {
    return;
  }

  return (
    <Box className={styles.notificationsWrapper}>
      <Stack gap="var(--default-spacing)" align="flex-end">
        {!opened && (
          <Stack
            gap="calc(var(--default-spacing) / 2)"
            align="flex-end"
            className={styles.notificationStack}
          >
            {notifications
              .filter((notification) => notification.visible)
              .map((notification) => (
                <Notification
                  key={notification.id}
                  className={styles.notification}
                  color={getColor(notification.type)}
                  onClose={() => notificationManager.hide(notification.id)}
                  onMouseEnter={() => notificationManager.pause(notification.id)}
                  onMouseLeave={() => notificationManager.resume(notification.id)}
                >
                  {notification.message}
                </Notification>
              ))}
          </Stack>
        )}
        <History
          show={opened}
          onClick={handleClick}
          notifications={notifications}
          getColor={getColor}
        />
      </Stack>
    </Box>
  );
};

export default Notifications;
