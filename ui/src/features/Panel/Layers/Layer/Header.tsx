/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import Minus from '@/assets/Minus';
import IconButton from '@/components/IconButton';
import mainManager from '@/managers/Main.init';
import { Datasource, Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};

export const Header: React.FC<Props> = (props) => {
  const { layer } = props;

  const [dataset, setDataset] = useState<Datasource>();

  useEffect(() => {
    const dataset = mainManager.getDatasource(layer.datasourceId);

    if (dataset) {
      setDataset(dataset);
    }
  }, []);

  return (
    <Group>
      <Stack justify="center" gap={1}>
        {dataset && (
          <Group gap="xs" justify="flex-start">
            <Text fw={700} size="xl">
              {dataset.provider}
            </Text>
            <Text size="xl">{dataset.name}</Text>
          </Group>
        )}

        <Title order={3} size="h4">
          {layer.name}
        </Title>
        <Group justify="space-between">
          <Text size="sm">{layer.parameters.join(', ')}</Text>
          {(layer.from || layer.to) && (
            <Text size="sm">
              {layer.from ?? '..'} - {layer.to ?? '..'}
            </Text>
          )}
        </Group>
      </Stack>
      <IconButton ml="auto" mr="md" onClick={() => mainManager.deleteLayer(layer.id)}>
        <Minus />
        <VisuallyHidden>Remove Layer</VisuallyHidden>
      </IconButton>
    </Group>
  );
};
