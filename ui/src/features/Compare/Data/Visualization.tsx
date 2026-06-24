/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Group, Loader, Stack, Title, useComputedColorScheme } from '@mantine/core';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Table from '@/components/Table';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Tabbed } from '@/features/Charts/Tabbed';
import { ETabTypes, TTypedOption } from '@/features/Charts/types';
import styles from '@/features/Compare/Compare.module.css';
import { TSimplifiedEntry } from '@/features/Compare/types';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import { LayerLocationGroup } from '@/hooks/useAllLocations';
import { useTimeseriesData } from '@/hooks/useTimeseriesData';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetLocationParams,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Location } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { getIdStore } from '@/utils/getIdStore';
import { getLabel } from '@/utils/getLabel';
import { normalizeBBox } from '@/utils/normalizeBBox';

type Props = {
  entry: TSimplifiedEntry;
  locationGroup: LayerLocationGroup | undefined;
  from: string;
  to: string;
  areControlsActive: boolean;
  onControlsActiveChange: (layerId: string) => void;
};
export const Visualization: React.FC<Props> = (props: Props) => {
  const {
    entry,
    from,
    to,
    locationGroup = { selectedFeatures: [], otherFeatures: [] },
    areControlsActive,
    onControlsActiveChange,
  } = props;

  const computedColorScheme = useComputedColorScheme();

  const { selectedFeatures, otherFeatures } = locationGroup;

  const [options, setOptions] = useState<TTypedOption[]>([]);
  const [showChart, setShowChart] = useState(true);
  const [showTable, setShowTable] = useState(false);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(
    entry.layer.datasourceId
  );

  const features = useMemo(() => {
    const allLocations = [...selectedFeatures, ...otherFeatures];
    return allLocations.filter((feature) =>
      entry.locations.includes(getId(feature, isStringIdentifierCollection))
    );
  }, [selectedFeatures, otherFeatures, entry.locations]);

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

  //   TODO: move this to a hook, better stability on
  const getData = useCallback(
    (
      collectionId: ICollection['id'],
      locationId: Location['id'],
      params: IGetLocationParams,
      signal?: AbortSignal
    ): Promise<CoverageCollection | CoverageJSON> => {
      if (entry.collectionType === CollectionType.EDR) {
        return awoService.getLocation(collectionId, locationId, {
          signal,
          params,
        });
      }

      if (entry.collectionType === CollectionType.EDRGrid) {
        const location = features.find((feature) => {
          const id = isStringIdentifierCollection
            ? (getIdStore(feature) ?? feature.id)
            : feature.id;

          return String(id) === locationId;
        });

        const bbox = location?.bbox;

        if (bbox) {
          return awoService.getCube(collectionId, {
            signal,
            params: { ...params, bbox: normalizeBBox(bbox) },
          });
        }

        throw new Error('Missing bbox for EDRGrid location');
      }

      throw new Error(`Unsupported collection type: ${entry.collectionType}`);
    },
    [entry.collectionType, features]
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

  const getType = (collectionType: CollectionType) => {
    switch (collectionType) {
      case CollectionType.EDR:
        return 'Location';
      case CollectionType.EDRGrid:
        return 'Grid';
      default:
        return 'Item';
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Group gap="var(--default-spacing)">
          <Title variant="h4" size="h5">
            {entry.layer.name}
          </Title>
          {isLoading && <Loader color="#0183a1" type="dots" />}
        </Group>

        <Group gap="var(--default-spacing)">
          {areControlsActive && (
            <>
              <Button
                size="sm"
                variant={showChart ? Variant.Selected : Variant.Secondary}
                onClick={() => setShowChart(!showChart)}
                disabled={entry.locations.length === 0}
              >
                Chart
              </Button>
              <Button
                size="sm"
                variant={showTable ? Variant.Selected : Variant.Secondary}
                onClick={() => setShowTable(!showTable)}
                disabled={entry.locations.length === 0}
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
      {entry.locations.length === 0 ? (
        <Group justify="center" align="center">
          Select locations from the panel on the left.
        </Group>
      ) : (
        <>
          {showChart && (
            <Tabbed
              collectionId={entry.layer.datasourceId}
              data={chartData}
              locationIds={entry.locations}
              theme={computedColorScheme}
              seriesLabels={seriesLabels}
              tabs={options}
              showTabs={areControlsActive}
              disabled={isLoading}
              isLoading={isLoading && chartData.length === 0}
            />
          )}
          {showTable && (
            <Box className={styles.tableWrapper}>
              <Table
                id={entry.layer.id}
                type={getType(entry.collectionType)}
                size="xs"
                fixed={false}
                json={chartData}
                labels={seriesLabels}
                options={options}
                disabled={isLoading}
              />
            </Box>
          )}
        </>
      )}
    </Stack>
  );
};
