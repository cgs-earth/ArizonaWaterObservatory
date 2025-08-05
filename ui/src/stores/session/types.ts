/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

export enum NotifificationType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

export type Notification = {
  id: string;
  message: string;
  type: NotifificationType;
  visible: boolean;
};

export type Loading = {
  id: string;
  message: string;
};

export type SessionState = {
  loadingInstances: Loading[];
  addLoadingInstance: (loadingInstance: Loading) => void;
  removeLoadingInstance: (id: string) => void;
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
};
