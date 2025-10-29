/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Group, Pagination, Stack } from '@mantine/core';
import NumberInput from '@/components/NumberInput';
import { Location } from '@/features/TopBar/Links/Location';
import styles from '@/features/TopBar/TopBar.module.css';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';
import { chunk } from '@/utils/chunk';

type Props = {
  locations: Feature[];
  collection: ICollection | undefined;
  layer: Layer;
  provider: string;
};

export const LocationBlock: React.FC<Props> = (props) => {
  const { locations, collection, layer, provider } = props;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(locations.length > 10 ? 10 : locations.length);
  const [chunkedLocations, setChunkedLocations] = useState<Feature[][]>([]);
  const [currentChunk, setCurrentChunk] = useState<Feature[]>([]);

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
    setPage(1);
  };

  useEffect(() => {
    const chunkedLocations = chunk(locations, pageSize);
    setChunkedLocations(chunkedLocations);
  }, [locations, pageSize]);

  useEffect(() => {
    if (chunkedLocations.length === 0 || chunkedLocations.length < page) {
      return;
    }

    const currentChunk = chunkedLocations[page - 1];
    setCurrentChunk(currentChunk);
  }, [chunkedLocations, page]);

  return (
    <Stack component="section" gap="xs" mb="md" className={styles.locationBlockWrapper}>
      {collection &&
        currentChunk.map((location) => (
          <Location
            key={`selected-location-${layer.id}-${location.id}`}
            location={location}
            layer={layer}
            collection={collection}
            provider={provider}
          />
        ))}
      <Group justify="space-between" align="flex-end">
        <NumberInput
          size="xs"
          label="Locations per page"
          value={pageSize}
          onChange={(value) => handlePageSizeChange(Number(value))}
          min={1}
          max={locations.length}
        />
        <Pagination
          size="sm"
          total={chunkedLocations.length}
          value={page}
          onChange={setPage}
          mt="sm"
        />
      </Group>
    </Stack>
  );
};
