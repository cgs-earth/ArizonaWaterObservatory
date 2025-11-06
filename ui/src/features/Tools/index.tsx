/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import BasemapSelector from '@/features/Tools/Basemap';
import { Draw } from '@/features/Tools/Draw';
import { FAQ } from '@/features/Tools/FAQ';
import { Geocoder } from '@/features/Tools/Geocoder';
import { Glossary } from '@/features/Tools/Glossary';
import { Legend } from '@/features/Tools/Legend';
import { Warning } from '@/features/Tools/Warning';

const Tools: React.FC = () => {
  return (
    <Group>
      <FAQ />
      <Glossary />
      <Legend />
      <BasemapSelector />
      <Draw />
      <Geocoder />
      <Warning />
    </Group>
  );
};

export default Tools;
