/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState } from 'react';
import {
  ComboboxData,
  Group,
  Loader,
  Select,
  Stack,
  Text,
  Title,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import Info from '@/assets/Info';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import loadingManager from '@/managers/Loading.init';
import notificationManager from '@/managers/Notification.init';
import awoService from '@/services/init/awo.init';
import { MainState } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';

type Props = {
  category: MainState['category'];
  onChange: (category: MainState['category']) => void;
  provider: MainState['provider'];
};

export const Category: React.FC<Props> = (props) => {
  const { category, onChange, provider } = props;

  const [categoryOptions, setCategoryOptions] = useState<ComboboxData>([]);
  const [isLoading, setIsLoading] = useState(false);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const getCategoryOptions = async () => {
    const loadingInstance = loadingManager.add(
      'Fetching category dropdown options',
      LoadingType.Data
    );

    try {
      setIsLoading(true);
      controller.current = new AbortController();

      const { parameterGroups } = await awoService.getCollections({
        params: {
          'parameter-name': '*',
          ...(provider ? { 'provider-name': provider } : {}),
        },
      });

      const categoryOptions: ComboboxData = parameterGroups
        .map((parameterGroup) => ({
          value: parameterGroup.label,
          label: parameterGroup.label,
        }))
        .filter(
          (parameterName, index, categoryOptions) =>
            categoryOptions.map(({ value }) => value).indexOf(parameterName.value) === index
        )
        .sort((a, b) => a.label.localeCompare(b.label));

      if (isMounted.current) {
        if (!parameterGroups.some((parameterGroup) => parameterGroup.label === category?.value)) {
          onChange(null);
        }

        setCategoryOptions(categoryOptions);
        setIsLoading(false);
      }
    } catch (error) {
      if (
        (error as Error)?.name === 'AbortError' ||
        (typeof error === 'string' && error === 'Component unmount')
      ) {
        console.log('Fetch request canceled');
      } else if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }

      if (isMounted.current) {
        setIsLoading(false);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  useEffect(() => {
    void getCategoryOptions();
  }, [provider]);

  const helpText = (
    <>
      <Text size="sm">
        Choose a data category to narrow down the available datsets. Categories group datasets by
        type <br />
        or theme (e.g., reservoir storage, atmospheric measurements, water constituents).
      </Text>
      <br />
      <Text size="sm">This helps you focus on datasets relevant to a domain of interest.</Text>
    </>
  );

  return (
    <Stack gap={0}>
      <Select
        size="sm"
        className={styles.filterSelect}
        label={
          <>
            <Tooltip multiline label={helpText}>
              <Group className={styles.filterTitleWrapper} gap="xs">
                <Title order={6} size="h4">
                  Category
                </Title>
                <Info />
              </Group>
            </Tooltip>
            <VisuallyHidden>{helpText}</VisuallyHidden>
          </>
        }
        placeholder="Select..."
        data={categoryOptions}
        value={category?.value}
        onChange={(_value, option) => onChange(option)}
        disabled={categoryOptions.length === 0 || isLoading}
        searchable
        clearable
      />
      {isLoading ? (
        <Group>
          <Loader color="blue" type="dots" />
          <Text size="sm">Updating Categories</Text>
        </Group>
      ) : (
        provider && <Text size="sm">Showing categories available for provider: {provider}</Text>
      )}
    </Stack>
  );
};
