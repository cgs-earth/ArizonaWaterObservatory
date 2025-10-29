/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createLoadingSlice } from '@/stores/session/slices/loading';
import { createMeasureSlice } from '@/stores/session/slices/measure';
import { createNotificationsSlice } from '@/stores/session/slices/notifications';
import { SessionState, Tool } from '@/stores/session/types';

const useSessionStore = create<SessionState>()(
  immer((set, get, store) => ({
    legendEntries: [],
    setLegendEntries: (legendEntries) => set({ legendEntries }),
    downloadModalOpen: false,
    setDownloadModalOpen: (downloadModalOpen) => set({ downloadModalOpen }),
    overlay: null,
    setOverlay: (overlay) => set({ overlay }),
    tools: {
      [Tool.Legend]: false,
    },
    setOpenTools: (tool, open) =>
      set((state) => ({
        tools: {
          ...state.tools,
          [tool]: open,
        },
      })),
    linkLocation: null,
    setLinkLocation: (linkLocation) => set({ linkLocation }),
    ...createLoadingSlice(set, get, store),
    ...createMeasureSlice(set, get, store),
    ...createNotificationsSlice(set, get, store),
  }))
);

export default useSessionStore;
