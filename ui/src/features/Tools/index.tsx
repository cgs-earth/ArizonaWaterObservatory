/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import BasemapSelector from '@/features/Tools/Basemap';
import { Draw } from '@/features/Tools/Draw';
import { Legend } from '@/features/Tools/Legend';
import { FAQ } from './FAQ';
import { Glossary } from './Glossary';

const Tools: React.FC = () => {
  return (
    <Group>
      <FAQ />
      <Glossary />
      <Legend />
      <BasemapSelector />
      <Draw />
    </Group>
  );
};

export default Tools;
