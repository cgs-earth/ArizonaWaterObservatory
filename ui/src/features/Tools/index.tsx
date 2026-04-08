/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import BasemapSelector from '@/features/Tools/Basemap';
import { Draw } from '@/features/Tools/Draw';
import { Geocoder } from '@/features/Tools/Geocoder';
import Legend from '@/features/Tools/Legend';
import { Screenshot } from '@/features/Tools/Screenshot';
import { Warnings } from '@/features/Tools/Warnings';
import SpatialSelection from './SpatialSelection';

const Tools: React.FC = () => {
  return (
    <Group>
      {/* <FAQ /> */}
      {/* <Glossary /> */}
      <Legend />
      <SpatialSelection />
      <Draw />
      <Screenshot />
      <BasemapSelector />
      <Geocoder />
      <Warnings />
    </Group>
  );
};

export default Tools;
