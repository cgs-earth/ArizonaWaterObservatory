/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';
import { getProvider } from '@/utils/provider';

type Props = {
  layer: Layer;
};

export const Header: React.FC<Props> = (props) => {
  const { layer } = props;

  const [dataset, setDataset] = useState<ICollection>();

  useEffect(() => {
    const dataset = mainManager.getDatasource(layer.datasourceId);

    if (dataset) {
      setDataset(dataset);
    }
  }, []);

  return (
    <Stack justify="center" gap={1}>
      {dataset && (
        <Text component="h3" size="lg" lineClamp={1} title={dataset.title}>
          <strong>{getProvider(dataset.id)}</strong> {dataset.title}
        </Text>
      )}

      <Title order={3} size="md" lineClamp={2} title={layer.name}>
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
  );
};
