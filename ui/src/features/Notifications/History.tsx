/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Notification, Stack, Tooltip } from '@mantine/core';
import NotificationsIcon from '@/assets/Notifications';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import styles from '@/features/Notifications/Notifications.module.css';
import notificationManager from '@/managers/Notification.init';
import { Notification as NotificationType, NotificationVariant } from '@/stores/session/types';

type Props = {
  show: boolean;
  onClick: (show: boolean) => void;
  notifications: NotificationType[];
  getColor: (type: NotificationVariant) => 'red' | 'green' | undefined;
};

export const History: React.FC<Props> = (props) => {
  const { show, onClick, notifications, getColor } = props;

  const count = notifications.filter(
    (notificiation) => !notificiation.visible && !notificiation.viewed
  ).length;

  return (
    <>
      {show && (
        <Stack
          gap="calc(var(--default-spacing) / 2)"
          align="flex-end"
          className={styles.notificationStack}
        >
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              className={styles.notification}
              color={getColor(notification.type)}
              onClose={() => notificationManager.delete(notification.id)}
              onMouseEnter={() => notificationManager.viewed(notification.id)}
            >
              {notification.message}
            </Notification>
          ))}
        </Stack>
      )}
      <Tooltip label="Change map styling." disabled={show}>
        <Box mt="calc(var(--default-spacing) / 2)">
          <IconButton
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => onClick(!show)}
          >
            <NotificationsIcon />
          </IconButton>
          {count > 0 && (
            <Box component="span" className={styles.unviewedCountIcon}>
              {count}
            </Box>
          )}
        </Box>
      </Tooltip>
    </>
  );
};
