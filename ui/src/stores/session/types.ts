/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Location } from '@/stores/main/types';
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
  Links = 'links',
  Share = 'share',
  Draw = 'draw',
  Basemap = 'basemap',
  Legend = 'legend',
  Info = 'info',
  Warning = 'warning',
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
  layerId: string;
  collectionId: string;
  color: string;
  visible: boolean;
};
export enum HelpTab {
  About = 'about',
  FAQ = 'FAQ',
  Glossary = 'glossary',
}

export type SessionState = {
  legendEntries: LegendEntry[];
  setLegendEntries: (legendEntries: SessionState['legendEntries']) => void;
  overlay: Overlay | null;
  setOverlay: (overlay: SessionState['overlay']) => void;
  tools: {
    [Tool.Legend]: boolean;
  };
  setOpenTools: (tool: Tool, open: boolean) => void;
  linkLocation: Location | null;
  setLinkLocation: (linkLocation: SessionState['linkLocation']) => void;
  helpTab: HelpTab;
  setHelpTab: (helpTab: SessionState['helpTab']) => void;
} & NotificationsSlice &
  LoadingSlice &
  MeasureSlice;
