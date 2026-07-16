/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';
import { useLoading } from '@/hooks/useLoading';
import { ICollection } from '@/services/edr.service';
import { collectionService } from '@/services/init';
import { Layer } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getProvider } from '@/utils/provider';

type Props = {
  layer: Layer;
  includeParameters?: boolean;
  includeDates?: boolean;
};

export const Header: React.FC<Props> = (props) => {
  const { layer, includeParameters = true, includeDates = true } = props;

  const [dataset, setDataset] = useState<ICollection>();
  const [parameters, setParameters] = useState<string[]>([]);
  const [provider, setProvider] = useState<string>('');
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

  const { isFetchingCollections } = useLoading();

  useEffect(() => {
    if (isFetchingCollections || dataset) {
      return;
    }

    const newDataset = collectionService.getDatasource(layer.datasourceId);

    if (newDataset) {
      setDataset(newDataset);

      const collectionType = getCollectionType(newDataset);
      setCollectionType(collectionType);

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
    <Stack justify="center" gap="calc(var(--default-spacing) / 4)">
      {dataset && (
        <Text component="h3" size="md" lineClamp={1} title={dataset.title}>
          <strong>{provider}</strong> {dataset.title}
        </Text>
      )}

      <Title order={3} size="sm" lineClamp={2} title={layer.name}>
        {layer.name}
      </Title>
      {[CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType) && (
        <Group justify="space-between" gap="var(--default-spacing)">
          {includeParameters && parameters.length > 0 && (
            <Text size="xs">{parameters.join(', ')}</Text>
          )}
          {includeDates && (layer.from || layer.to) && (
            <Text size="xs">
              {layer.from ? dayjs(layer.from).format('MM/DD/YYYY') : '..'} -{' '}
              {layer.to ? dayjs(layer.to).format('MM/DD/YYYY') : '..'}
            </Text>
          )}
        </Group>
      )}
    </Stack>
  );
};
