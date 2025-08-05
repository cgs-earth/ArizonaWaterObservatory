/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { MapPage } from './pages/Map.page';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MapPage />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
