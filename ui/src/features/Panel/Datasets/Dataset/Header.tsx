/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import Plus from '@/assets/Plus';
import IconButton from '@/components/IconButton';
import mainManager from '@/managers/Main.init';
import { Datasource } from '@/stores/main/types';

type Props = {
  dataset: Datasource;
};

export const Header: React.FC<Props> = (props) => {
  const { dataset } = props;

  return (
    <Group>
      <Stack justify="center" gap={1}>
        <Group gap="xs" justify="flex-start">
          <Text fw={700} size="xl">
            {dataset.provider}
          </Text>
          <Text component="h3" size="xl">
            {dataset.name}
          </Text>
        </Group>
        <Group gap="xs" justify="flex-start">
          <Text fw={700} size="sm">
            Date Updated:
          </Text>
          <Text size="sm">mm/dd/yyyy</Text>
        </Group>
        <Text size="xs">Parameters: {dataset.parameters.join('')}</Text>
      </Stack>
      <IconButton ml="auto" mr="md" onClick={() => mainManager.createLayer(dataset.id)}>
        <Plus />
        <VisuallyHidden>Add Layer</VisuallyHidden>
      </IconButton>
    </Group>
  );
};
