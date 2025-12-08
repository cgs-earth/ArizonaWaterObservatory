/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '@mantine/core';
import Map from '@/features/Map';
import DateSelector from '@/features/Tools/DateSelector';
import useMainStore from '@/stores/main';

/**
 * This component sets up the main map page of the application.
 *
 * Responsibilities:
 * - Renders the `Map` component with the required Mapbox access token.
 *
 * @component
 */
export const MapPage: React.FC = () => {
  const paletteLayers = useMainStore((state) => state.layers).filter(
    (layer) => layer.paletteDefinition && layer.paletteDefinition !== null
  );

  return (
    <Box w="100%" h="100%">
      {paletteLayers.length > 0 && <DateSelector layers={paletteLayers} />}
      <Map accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN} />
    </Box>
  );
};
