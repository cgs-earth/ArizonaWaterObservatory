/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createDrawingSlice } from '@/stores/session/slices/drawing';
import { createLoadingSlice } from '@/stores/session/slices/loading';
import { createNotificationsSlice } from '@/stores/session/slices/notifications';
import { SessionState, Tools } from '@/stores/session/types';

const useSessionStore = create<SessionState>()(
  immer((set, get, store) => ({
    legendEntries: [],
    setLegendEntries: (legendEntries) => set({ legendEntries }),
    downloadModalOpen: false,
    setDownloadModalOpen: (downloadModalOpen) => set({ downloadModalOpen }),

    tools: {
      [Tools.Legend]: false,
    },
    setOpenTools: (tool, open) =>
      set((state) => ({
        tools: {
          ...state.tools,
          [tool]: open,
        },
      })),
    ...createLoadingSlice(set, get, store),
    ...createNotificationsSlice(set, get, store),
    ...createDrawingSlice(set, get, store),
  }))
);

export default useSessionStore;
