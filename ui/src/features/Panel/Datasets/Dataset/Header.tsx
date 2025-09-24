/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { Group, Stack, Text, VisuallyHidden } from '@mantine/core';
import Plus from '@/assets/Plus';
import IconButton from '@/components/IconButton';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { ICollection } from '@/services/edr.service';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { getParameterList } from '@/utils/parameters';
import { getProvider } from '@/utils/provider';

type Props = {
  dataset: ICollection;
};

export const Header: React.FC<Props> = (props) => {
  const { dataset } = props;

  const controller = useRef<AbortController | null>(null);

  const handleClick = async (name: string, id: ICollection['id']) => {
    const loadingInstance = loadingManager.add(
      'Fetching category dropdown options',
      LoadingType.Data
    );

    try {
      controller.current = new AbortController();

      await mainManager.createLayer(id, controller.current.signal);
      notificationManager.show(`Added layer for: ${name}`, NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  const provider = getProvider(dataset.id);

  return (
    <Group>
      <Stack justify="center" gap={1}>
        <Group gap="xs" justify="flex-start">
          {provider && (
            <Text fw={700} size="xl">
              {provider}
            </Text>
          )}
          <Text component="h3" size="xl">
            {dataset.title}
          </Text>
        </Group>
        <Group gap="xs" justify="flex-start">
          <Text fw={700} size="sm">
            Date Updated:
          </Text>
          <Text size="sm">mm/dd/yyyy</Text>
        </Group>
        <Text size="xs">Parameters: {getParameterList(dataset).join(',')}</Text>
      </Stack>
      <IconButton
        ml="auto"
        mr="md"
        onClick={() => handleClick(dataset.title ?? dataset.id, dataset.id)}
      >
        <Plus />
        <VisuallyHidden>Add Layer</VisuallyHidden>
      </IconButton>
    </Group>
  );
};
