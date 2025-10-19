/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Text, Title, Tooltip } from '@mantine/core';

export const FilterTitle: React.FC = () => {
  const helpText = (
    <>
      <Text size="sm">Filter the list of datasets.</Text>
      <br />
      <Text size="sm">
        Locate relevant datsets by filtering for data categories, publishers, parameters and more.
      </Text>
    </>
  );

  return (
    <Tooltip label={helpText} openDelay={500}>
      <Stack justify="center" gap={1}>
        <Title order={3}>Filter</Title>
      </Stack>
    </Tooltip>
  );
};
