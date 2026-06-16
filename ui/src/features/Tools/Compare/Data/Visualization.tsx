/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Group, Stack, Title, useComputedColorScheme } from '@mantine/core';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import { StringIdentifierCollections } from '@/consts/collections';
import { Tabbed } from '@/features/Charts/Tabbed';
import { ETabTypes, TTypedOption } from '@/features/Charts/types';
import { useTimeseriesData } from '@/hooks/useTimeseriesData';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetCubeParams,
  IGetLocationParams,
} from '@/services/edr.service';
import { collectionService } from '@/services/init';
import awoService from '@/services/init/awo.init';
import { Location } from '@/stores/main/types';
import { getIdStore } from '@/utils/getIdStore';
import { getLabel } from '@/utils/getLabel';
import { TSimplifiedEntry } from '../types';

type Props = {
  entry: TSimplifiedEntry;
  from: string;
  to: string;
  areControlsActive: boolean;
  onControlsActiveChange: (layerId: string) => void;
};
export const Visualization: React.FC<Props> = (props: Props) => {
  const { entry, from, to, areControlsActive, onControlsActiveChange } = props;

  const computedColorScheme = useComputedColorScheme();

  const [options, setOptions] = useState<TTypedOption[]>([]);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(entry.datasourceId);

  const { organizedLabels } = useMemo(() => {
    const layer = collectionService.getLayer(entry.layerId);

    const organizedLocations = layer
      ? entry.locations.map((id) => {
          return { id };
        })
      : [];

    const organizedLabels: Record<string, string> = {};

    for (const location of organizedLocations) {
      organizedLabels[location.id] = location.id;
    }

    return { organizedLocations, organizedLabels };
  }, [entry.locations, entry.layerId, isStringIdentifierCollection]);

  //   TODO: move this to a hook, account for grid fetch which requires a bbox
  const getData = useCallback(
    (
      collectionId: ICollection['id'],
      locationId: Location['id'],
      params: IGetLocationParams,
      signal?: AbortSignal
    ) =>
      awoService.getLocation<CoverageCollection | CoverageJSON>(collectionId, locationId, {
        signal,
        params,
      }),
    []
  );

  const { data, chartData, seriesLabels, isLoading, error } = useTimeseriesData({
    collectionId: entry.datasourceId, // Placeholder
    locationIds: entry.locations,
    parameters: entry.parameters,
    from,
    to,
    getData,
    coverageLabels: organizedLabels,
  });

  useEffect(() => {
    const paramOptions = entry.parameters.map(({ id, name, unit }) => ({
      value: id,
      label: `${name} (${unit})`,
      type: ETabTypes.Parameter,
    }));

    const unitOptions = Array.from(new Set(entry.parameters.map((p) => p.unit))).map((unit) => ({
      value: unit,
      label: unit,
      type: ETabTypes.Unit,
    }));

    setOptions([...paramOptions, ...unitOptions]);
  }, [entry.parameters]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title variant="h4" size="h3">
          {entry.name}
        </Title>
        <Group gap="var(--default-spacing)">
          <Button>Chart</Button>
          <Button>Table</Button>
          <Checkbox
            label="Show Controls"
            checked={areControlsActive}
            onChange={() => onControlsActiveChange(entry.layerId)}
          />
        </Group>
      </Group>
      <Tabbed
        collectionId={entry.datasourceId}
        data={chartData}
        locationIds={entry.locations}
        theme={computedColorScheme}
        seriesLabels={seriesLabels}
        tabs={options}
      />
    </Stack>
  );
};
