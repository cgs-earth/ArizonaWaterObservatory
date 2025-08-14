/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Title } from '@mantine/core';

export const FilterTitle: React.FC = () => {
  return (
    <Stack justify="center" gap={1}>
      <Title order={3}>Filter</Title>
    </Stack>
  );
};
