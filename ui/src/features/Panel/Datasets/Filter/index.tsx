/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Divider, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Panel.module.css';
import useMainStore from '@/stores/main';

const Filter: React.FC = () => {
  const provider = useMainStore((state) => state.provider);
  const category = useMainStore((state) => state.category);
  const collection = useMainStore((state) => state.collection);

  return (
    <Stack className={styles.filterBody} justify="flex-start" align="center">
      {!provider && !category && !collection && <Text>No filters selected</Text>}
      {provider && (
        <>
          <Text fw={700}>Provider</Text>
          <Text>{provider}</Text>
        </>
      )}
      {provider && (category || collection) && <Divider />}
      {category && (
        <>
          <Text fw={700}>Category</Text>
          <Text>{category.label}</Text>
        </>
      )}
      {collection && (category || provider) && <Divider />}
      {collection && (
        <>
          <Text fw={700}>Collection</Text>
          <Text>{collection}</Text>
        </>
      )}
      <Button size="xs" variant={Variant.Tertiary}>
        Configure
      </Button>
    </Stack>
  );
};

export default Filter;
