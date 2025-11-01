/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import { useLoading } from '@/hooks/useLoading';
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
  const [parameters, setParameters] = useState<string[]>([]);
  const [provider, setProvider] = useState<string>('');

  const { isFetchingCollections } = useLoading();

  useEffect(() => {
    if (isFetchingCollections || dataset) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset) {
      setDataset(newDataset);
      const paramObjects = Object.values(newDataset?.parameter_names ?? {});

      const parameters = paramObjects
        .filter((object) => layer.parameters.includes(object.id))
        .map((object) => object.name);
      setParameters(parameters);
    }
  }, [layer, isFetchingCollections]);

  useEffect(() => {
    if (!dataset || provider.length > 0) {
      return;
    }

    const newProvider = getProvider(dataset.id);
    setProvider(newProvider);
  }, [dataset, isFetchingCollections]);

  return (
    <Stack justify="center" gap={1}>
      {dataset && (
        <Text component="h3" size="md" lineClamp={1} title={dataset.title}>
          <strong>{provider}</strong> {dataset.title}
        </Text>
      )}

      <Title order={3} size="sm" lineClamp={2} title={layer.name}>
        {layer.name}
      </Title>
      <Group justify="space-between" gap={8}>
        {parameters.length > 0 && <Text size="xs">{parameters.join(', ')}</Text>}
        {(layer.from || layer.to) && (
          <Text size="xs">
            {layer.from ? dayjs(layer.from).format('MM/DD/YYYY') : '..'} -{' '}
            {layer.to ? dayjs(layer.to).format('MM/DD/YYYY') : '..'}
          </Text>
        )}
      </Group>
    </Stack>
  );
};
