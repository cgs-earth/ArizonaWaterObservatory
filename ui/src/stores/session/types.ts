/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LoadingSlice } from '@/stores/session/slices/loading';
import { MeasureSlice } from '@/stores/session/slices/measure';
import { NotificationsSlice } from '@/stores/session/slices/notifications';

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

export enum LoadingType {
  Locations = 'locations',
  Collections = 'collections',
  Geography = 'geography',
  Data = 'data',
  Share = 'share',
}

export enum Tool {
  Legend = 'legend',
}

export enum Overlay {
  Share = 'share',
  Draw = 'draw',
}

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  visible: boolean;
};

export type Loading = {
  id: string;
  type: LoadingType;
  message: string;
};

export type LegendEntry = {
  collectionId: string;
  color: string;
  visible: boolean;
};

export type SessionState = {
  legendEntries: LegendEntry[];
  setLegendEntries: (legendEntries: SessionState['legendEntries']) => void;
  overlay: Overlay | null;
  setOverlay: (overlay: SessionState['overlay']) => void;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (downloadModalOpen: SessionState['downloadModalOpen']) => void;
  tools: {
    [Tool.Legend]: boolean;
  };
  setOpenTools: (tool: Tool, open: boolean) => void;
} & NotificationsSlice &
  LoadingSlice &
  MeasureSlice;
