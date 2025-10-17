/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import { Draw } from '@/features/Tools/Draw';
import BasemapSelector from './Basemap';

const Tools: React.FC = () => {
  return (
    <Group>
      <BasemapSelector />
      <Draw />
    </Group>
  );
};

export default Tools;
