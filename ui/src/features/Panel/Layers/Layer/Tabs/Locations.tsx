/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import NumberInput from '@/components/NumberInput';
import Pagination from '@/components/Pagination';
import { StringIdentifierCollections } from '@/consts/collections';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import styles from '@/features/Panel/Panel.module.css';
import { useLocations } from '@/hooks/useLocations';
import useMainStore from '@/stores/main';
import { Layer, Location } from '@/stores/main/types';
import { chunk } from '@/utils/chunk';
import { getLabel } from '@/utils/getLabel';

type Props = {
  layer: Layer;
  isLoading: boolean;
};

export const Locations: React.FC<Props> = (props) => {
  const { layer } = props;

  const { selectedLocations, otherLocations } = useLocations(layer);

  const addLocation = useMainStore((state) => state.addLocation);
  const removeLocation = useMainStore((state) => state.removeLocation);

  const combinedLocations = useMemo(() => {
    const selLocations = selectedLocations.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        isSelected: true,
      },
    }));

    return [...selLocations, ...otherLocations];
  }, [selectedLocations, otherLocations]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    combinedLocations.length > 10 ? 10 : combinedLocations.length
  );
  const [chunkedLocations, setChunkedLocations] = useState<(typeof combinedLocations)[number][][]>(
    []
  );
  const [currentChunk, setCurrentChunk] = useState<(typeof combinedLocations)[number][]>([]);

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
    setPage(1);
  };

  useEffect(() => {
    setPageSize(combinedLocations.length > 10 ? 10 : combinedLocations.length);
  }, [combinedLocations]);

  useEffect(() => {
    const chunkedLocations = chunk(combinedLocations, pageSize);
    setChunkedLocations(chunkedLocations);
  }, [combinedLocations, pageSize]);

  useEffect(() => {
    if (chunkedLocations.length === 0 || chunkedLocations.length < page) {
      setCurrentChunk([]);
      return;
    }

    const currentChunk = chunkedLocations[page - 1];
    setCurrentChunk(currentChunk);
  }, [chunkedLocations, page]);

  const handleClick = (checked: boolean, id: Location['id']) => {
    if (checked) {
      addLocation({
        id,
        layerId: layer.id,
      });
    } else {
      removeLocation({
        id,
        layerId: layer.id,
      });
    }
  };

  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);
  const halfway = Math.round(pageSize / 2);

  return (
    <Stack className={styles.entry} gap="var(--default-spacing)">
      <Group gap="calc(var(--default-spacing) * 2)" align="flex-start">
        <Stack gap="calc(var(--default-spacing) / 2)">
          {currentChunk.slice(0, halfway).map((location) => {
            const label = layer.label ? getLabel(location, layer.label) : null;
            const id = getId(location, isStringIdentifierCollection);
            return (
              <Checkbox
                size="xs"
                key={`layer-tool-location-${layer.id}-${id}`}
                onClick={(event) => handleClick(event.currentTarget.checked, id)}
                checked={Boolean(location.properties?.isSelected)}
                label={label ? `${label} (${id})` : id}
              />
            );
          })}
        </Stack>
        <Stack gap="calc(var(--default-spacing) / 2)">
          {currentChunk.slice(halfway).map((location) => {
            const label = layer.label ? getLabel(location, layer.label) : null;
            const id = getId(location, isStringIdentifierCollection);
            return (
              <Checkbox
                size="xs"
                key={`layer-tool-location-${layer.id}-${id}`}
                onClick={(event) => handleClick(event.currentTarget.checked, id)}
                checked={Boolean(location.properties?.isSelected)}
                label={label ? `${label} (${id})` : id}
              />
            );
          })}
        </Stack>
      </Group>
      <Group>
        <NumberInput
          size="xs"
          label="Entries shown"
          value={pageSize}
          onChange={(value) => handlePageSizeChange(Number(value))}
          min={1}
          max={combinedLocations.length}
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
