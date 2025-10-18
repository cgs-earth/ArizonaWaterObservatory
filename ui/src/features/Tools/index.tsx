/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group } from '@mantine/core';
import BasemapSelector from '@/features/Tools/Basemap';
import { Draw } from '@/features/Tools/Draw';

const Tools: React.FC = () => {
  return (
    <Group>
      <BasemapSelector />
      <Draw />
    </Group>
  );
};

export default Tools;
