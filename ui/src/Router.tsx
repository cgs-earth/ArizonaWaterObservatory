/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { DataPage } from '@/pages/Data.page';
import { LayoutPage } from '@/pages/Layout.page';
import { MapPage } from '@/pages/Map.page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutPage />,
    children: [
      { index: true, element: <MapPage /> }, // renders at '/'
      { path: 'map', element: <MapPage /> }, // renders at '/map'
      { path: 'data', element: <DataPage /> }, // renders at '/data'
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
