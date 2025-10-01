/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { DrawingSlice } from './slices/drawing';
import { LoadingSlice } from './slices/loading';
import { NotificationsSlice } from './slices/notifications';

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
}

export enum Tools {
  Legend = 'legend',
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

export enum DrawMode {
  Polygon = 'polygon',
  Measure = 'measure',
  Select = 'select',
}

export type SessionState = {
  legendEntries: LegendEntry[];
  setLegendEntries: (legendEntries: SessionState['legendEntries']) => void;
  downloadModalOpen: boolean;
  setDownloadModalOpen: (downloadModalOpen: SessionState['downloadModalOpen']) => void;
  tools: {
    [Tools.Legend]: boolean;
  };
  setOpenTools: (tool: Tools, open: boolean) => void;
} & NotificationsSlice &
  LoadingSlice &
  DrawingSlice;
