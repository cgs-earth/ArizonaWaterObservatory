/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { Group, Pagination, Stack } from '@mantine/core';
import NumberInput from '@/components/NumberInput';
import { Grid } from '@/features/TopBar/Links/Grid';
import { Location } from '@/features/TopBar/Links/Location';
import styles from '@/features/TopBar/TopBar.module.css';
import { ICollection } from '@/services/edr.service';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { chunk } from '@/utils/chunk';
import { CollectionType } from '@/utils/collection';

type Props = {
  locations: Feature[];
  collection: ICollection | undefined;
  layer: Layer;
  collectionType: CollectionType;
  linkLocation?: LocationType | null;
};

export const LayerBlock: React.FC<Props> = (props) => {
  const { locations, collection, layer, collectionType, linkLocation = null } = props;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(locations.length > 10 ? 10 : locations.length);
  const [chunkedLocations, setChunkedLocations] = useState<Feature[][]>([]);
  const [currentChunk, setCurrentChunk] = useState<Feature[]>([]);

  const locationRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
    setPage(1);
  };

  useEffect(() => {
    const chunkedLocations = chunk(locations, pageSize);
    setChunkedLocations(chunkedLocations);
  }, [locations, pageSize]);

  useEffect(() => {
    if (!linkLocation || chunkedLocations.length === 0) {
      return;
    }

    for (let i = 0; i < chunkedLocations.length; i++) {
      const linkLocationInChunk = chunkedLocations[i].some(
        (location) => location.id === linkLocation.id
      );
      if (linkLocationInChunk) {
        setPage(i + 1);
        break;
      }
    }
  }, [chunkedLocations]);

  useEffect(() => {
    if (chunkedLocations.length === 0 || chunkedLocations.length < page) {
      return;
    }

    const currentChunk = chunkedLocations[page - 1];
    setCurrentChunk(currentChunk);
  }, [chunkedLocations, page]);

  useEffect(() => {
    if (linkLocation?.id && locationRefs.current[linkLocation.id]) {
      locationRefs.current[linkLocation.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentChunk]);

  return (
    <Stack component="section" gap="xs" mb="md" className={styles.locationBlockWrapper}>
      {collection &&
        currentChunk.map((location) => (
          <>
            {collectionType === CollectionType.EDR && (
              <Location
                key={`selected-location-${layer.id}-${location.id}`}
                ref={(el) => {
                  locationRefs.current[String(location.id)] = el;
                }}
                linkLocation={linkLocation}
                location={location}
                layer={layer}
                collection={collection}
              />
            )}
          </>
        ))}
      {collection &&
        currentChunk.map((location) => (
          <>
            {collectionType === CollectionType.EDRGrid && (
              <Grid
                key={`selected-grid-${layer.id}-${location.id}`}
                ref={(el) => {
                  locationRefs.current[String(location.id)] = el;
                }}
                linkLocation={linkLocation}
                location={location}
                layer={layer}
                collection={collection}
              />
            )}
          </>
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
