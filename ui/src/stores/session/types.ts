/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { Location } from '@/stores/main/types';
import { LoadingSlice } from '@/stores/session/slices/loading';
import { MeasureSlice } from '@/stores/session/slices/measure';
import { NotificationsSlice } from '@/stores/session/slices/notifications';
import { WarningsSlice } from '@/stores/session/slices/warning';

export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Info = 'info',
}

export enum LoadingType {
  Collections = 'collections',
  Data = 'data',
  Geography = 'geography',
  Locations = 'locations',
  Share = 'share',
}

export enum Tool {
  Legend = 'legend',
}

export enum Overlay {
  Basemap = 'basemap',
  Date = 'date',
  Draw = 'draw',
  Download = 'download',
  Filter = 'filter',
  Info = 'info',
  Legend = 'legend',
  Links = 'links',
  Screenshot = 'screenshot',
  Share = 'share',
  Warning = 'warning',
}

export type Notification = {
  id: string;
  message: string;
  type: NotificationType;
  visible: boolean;
};

export type Warning = {
  id: string;
  content: ReactNode;
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
  Contact = 'contact',
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
  MeasureSlice &
  WarningsSlice;
