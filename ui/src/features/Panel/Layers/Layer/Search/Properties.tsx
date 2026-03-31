/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GeoJsonProperties } from 'geojson';
import { Box, Divider, Group, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Layers/Layer/Search/Search.module.css';
import Table from '@/features/Table';

type Props = {
  properties: GeoJsonProperties;
};

export const Properties: React.FC<Props> = (props) => {
  const { properties } = props;

  const [showTable, setShowTable] = useState(false);
  const [list, setList] = useState<string[]>([]);
  const [count, setCount] = useState(5);

  useEffect(() => {
    setList(Object.keys(properties ?? {}));
  }, [properties]);

  const getMoreLabel = () => {
    return Math.min(5, list.length - count);
  };

  const getLessLabel = () => {
    return Math.min(5, count - 5);
  };

  const handleShow = () => {
    setShowTable(!showTable);
  };

  const handleMore = () => {
    setCount(Math.min(count + 5, list.length));
  };

  const handleLess = () => {
    setCount(Math.max(count - 5, 5));
  };

  const showMore = list.length > count;
  const showLess = count > 5;

  return (
    <>
      {!showTable && (
        <>
          <Text size="xs" fw={700} mt="var(--default-spacing)">
            Properties:
          </Text>
          <Text size="xs"> {list.slice(0, count).join(', ')}</Text>
          <Divider />
          <Group justify="space-between" align="flex-end">
            <Text size="sm">{list.length} properties in total</Text>
            <Stack gap={0}>
              <Text size="xs" fw={700}>
                Show More:
              </Text>
              <Group gap="calc(var(--default-spacing) * 1.35)">
                {showMore && (
                  <IconButton size="sm" onClick={handleMore} className={styles.propertiesButton}>
                    <Text size="xs">+ {getMoreLabel()}</Text>
                  </IconButton>
                )}
                {showMore && showLess && <Divider orientation="vertical" />}
                {showLess && (
                  <IconButton size="sm" onClick={handleLess} className={styles.propertiesButton}>
                    <Text size="xs">- {getLessLabel()}</Text>
                  </IconButton>
                )}
              </Group>
            </Stack>
          </Group>
        </>
      )}
      <Box mx="auto">
        <Button
          onClick={handleShow}
          variant={Variant.Secondary}
          size="xs"
          mt="var(--default-spacing)"
        >
          {showTable ? 'Hide Sample Feature' : 'Show Sample Feature'}
        </Button>
      </Box>
      {showTable && <Table properties={properties} search size="xs" />}
    </>
  );
};
