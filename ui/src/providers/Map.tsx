/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { PropsWithChildren } from 'react';
import { MapProvider } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import { MINI_MAP_ID } from '@/features/Tools/Compare/MiniMap/consts';

// import { MAP_ID } from '@/features/Map/consts';

/**
 * Provides Map Context to allow accessing maps across application
 *
 * @component
 */
export const Map: React.FC<PropsWithChildren> = ({ children }) => {
  const mapIds: string[] = [MAP_ID, MINI_MAP_ID];

  return <MapProvider mapIds={mapIds}>{children}</MapProvider>;
};
