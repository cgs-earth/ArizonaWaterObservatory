/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Box, Collapse, Divider, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Chevron from '@/assets/Chevron';
import Button from '@/components/Button';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import useMainStore from '@/stores/main';

export const Body: React.FC = () => {
  const [opened, { toggle, close }] = useDisclosure(false);

  const [activeFilters, setActiveFilters] = useState<{ title: string; value: string }[]>([]);

  const provider = useMainStore((state) => state.provider);
  const setProvider = useMainStore((state) => state.setProvider);
  const category = useMainStore((state) => state.category);
  const setCategory = useMainStore((state) => state.setCategory);
  const search = useMainStore((state) => state.search);
  const setSearch = useMainStore((state) => state.setSearch);

  useEffect(() => {
    const activeFilters: { title: string; value: string }[] = [];

    if (search) {
      activeFilters.push({ title: 'Text Search', value: search });
    }

    if (provider) {
      activeFilters.push({ title: 'Provider', value: provider });
    }

    if (category) {
      activeFilters.push({ title: 'Category', value: category.label });
    }

    if (activeFilters.length === 0) {
      close();
    }

    setActiveFilters(activeFilters);
  }, [provider, category, search]);

  const getMessage = (count: number) => {
    if (count <= 0) {
      return 'No filters active';
    }

    if (count === 1) {
      return '1 filter active';
    }

    return `${count} filters active`;
  };

  const handleDelete = () => {
    setProvider(null);
    setCategory(null);
    setSearch(null);
  };

  const noFilters = activeFilters.length === 0;

  return (
    <Box className={styles.filterBodyWrapper}>
      <UnstyledButton
        disabled={noFilters}
        data-disabled={noFilters}
        onClick={toggle}
        className={styles.filterBodyControlButton}
      >
        <Group w="100%" justify="space-between" gap="var(--default-spacing)" p={0}>
          <Text>{getMessage(activeFilters.length)}</Text>
          <Box
            component="span"
            className={`${styles.filterBodyControl} ${opened ? styles.rotate180 : ''}`}
          >
            <Chevron />
          </Box>
        </Group>
      </UnstyledButton>

      <Collapse in={opened}>
        <Box className={styles.filterBody}>
          <Stack gap="var(--default-spacing)">
            {activeFilters.map((activeFilter) => (
              <Stack
                gap="calc(var(--default-spacing) / 2)"
                key={`filter-display-${activeFilter.title}`}
              >
                <Text fw={700} size="sm">
                  {activeFilter.title}
                </Text>
                <Text size="sm">{activeFilter.value}</Text>
                <Divider />
              </Stack>
            ))}

            <Group justify="flex-end" p="var(--default-spacing)">
              <Button
                size="xs"
                className={styles.deleteButton}
                disabled={noFilters}
                data-disabled={noFilters}
                onClick={handleDelete}
              >
                Clear Filters
              </Button>
            </Group>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};
