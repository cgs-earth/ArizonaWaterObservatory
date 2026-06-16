/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Group, Stack, Title, useComputedColorScheme } from '@mantine/core';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Table from '@/components/Table';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Tabbed } from '@/features/Charts/Tabbed';
import { ETabTypes, TTypedOption } from '@/features/Charts/types';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { useLocations } from '@/hooks/useLocations';
import { useTimeseriesData } from '@/hooks/useTimeseriesData';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetLocationParams,
} from '@/services/edr.service';
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

  const { selectedLocations, otherLocations } = useLocations(entry.layer);

  const [options, setOptions] = useState<TTypedOption[]>([]);
  const [showChart, setShowChart] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(
    entry.layer.datasourceId
  );

  const features = useMemo(() => {
    const allLocations = [...selectedLocations, ...otherLocations];
    return allLocations.filter((feature) =>
      entry.locations.includes(getId(feature, isStringIdentifierCollection))
    );
  }, [entry.locations]);

  const { organizedLabels } = useMemo(() => {
    const { layer } = entry;

    const organizedLocations = features.map((location) => {
      const id = String(
        isStringIdentifierCollection ? (getIdStore(location) ?? location.id) : location.id
      );
      const label = layer.label ? (getLabel(location, layer.label) ?? id) : id;
      return { id, label };
    });

    const organizedLabels: Record<string, string> = {};

    for (const location of organizedLocations) {
      organizedLabels[location.id] =
        location.label !== location.id ? `${location.label} (${location.id})` : location.label;
    }
    return { organizedLocations, organizedLabels };
  }, [entry.locations, entry.layer, isStringIdentifierCollection]);

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

  const { chartData, seriesLabels, isLoading } = useTimeseriesData({
    collectionId: entry.layer.datasourceId, // Placeholder
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
        <Title variant="h4" size="h5">
          {entry.layer.name}
        </Title>
        <Group gap="var(--default-spacing)">
          {areControlsActive && (
            <>
              <Button
                size="sm"
                variant={showChart ? Variant.Selected : Variant.Secondary}
                onClick={() => setShowChart(!showChart)}
                disabled={isLoading}
              >
                Chart
              </Button>
              <Button
                size="sm"
                variant={showTable ? Variant.Selected : Variant.Secondary}
                onClick={() => setShowTable(!showTable)}
                disabled={isLoading}
              >
                Table
              </Button>
            </>
          )}
          <Checkbox
            label="Show Controls"
            size="sm"
            checked={areControlsActive}
            onChange={() => onControlsActiveChange(entry.layer.id)}
          />
        </Group>
      </Group>
      {showChart && (
        <Tabbed
          collectionId={entry.layer.datasourceId}
          data={chartData}
          locationIds={entry.locations}
          theme={computedColorScheme}
          seriesLabels={seriesLabels}
          tabs={options}
          showTabs={areControlsActive}
        />
      )}
      {showTable && (
        <Box className={styles.tableWrapper}>
          <Table size="xs" fixed={false} json={chartData} labels={seriesLabels} options={options} />
        </Box>
      )}
    </Stack>
  );
};
