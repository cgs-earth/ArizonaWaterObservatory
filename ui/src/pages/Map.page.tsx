/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Map from '@/features/Map';

/**
 * This component sets up the main map page of the application.
 *
 * Responsibilities:
 * - Renders the `Map` component with the required Mapbox access token.
 *
 * @component
 */
export const MapPage: React.FC = () => {
  return <Map accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN} />;
};
