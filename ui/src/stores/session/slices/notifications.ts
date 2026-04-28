/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { StateCreator } from 'zustand';
import { Notification, SessionState } from '@/stores/session/types';

export interface NotificationsSlice {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  hideNotification: (id: string) => void;
  markViewed: (id: string) => void;
  hasNotification: (text: string) => boolean;
}

export const createNotificationsSlice: StateCreator<
  SessionState,
  [['zustand/immer', never]],
  [],
  NotificationsSlice
> = (set, get) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { ...notification, createdAt: Date.now() }],
    })),
  hideNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((notification) => notification.id === id);

      if (!notification || !notification.visible) {
        return;
      }

      notification.visible = false;
    }),
  markViewed: (id) =>
    set((state) => {
      const notification = state.notifications.find((notification) => notification.id === id);

      if (!notification || notification.viewed) {
        return;
      }

      notification.viewed = true;
    }),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    })),
  hasNotification: (text) =>
    get().notifications.some((notification) => notification.message.includes(text)),
});
