/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { bbox } from '@turf/turf';
import { BBox, Feature } from 'geojson';
import { Box, Divider, Group, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Charts } from '@/features/Charts';
import { TWrappedCoverage } from '@/features/Charts/types';
import { Parameter } from '@/features/Popup';
import styles from '@/features/Popup/Popup.module.css';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetCubeParams,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { getIdStore } from '@/utils/getIdStore';
import { normalizeBBox } from '@/utils/normalizeBBox';

type Props = {
  location: LocationType;
  locations: LocationType[];
  feature: Feature;
  layer: Layer;
  datasetName: string;
  parameters: Parameter[];
  handleLocationChange: (id: string | null) => void;
  handleLinkClick: () => void;
};

export const Grid: React.FC<Props> = (props) => {
  const { location, locations, feature, layer, parameters, handleLocationChange, handleLinkClick } =
    props;

  const [tab, setTab] = useState<'chart' | 'table'>('chart');

  const [times, setTimes] = useState<{ value: string; label: string }[]>([]);
  const [time, setTime] = useState<{ value: string; label: string }>();
  const [displayValues, setDisplayValues] = useState<
    { value: string; label: string; unit: string }[]
  >([]);
  const [id, setId] = useState<string>();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [chartDisabled, setChartDisabled] = useState(false);

  useEffect(() => {
    setChartDisabled(parameters.length === 0);
    if (parameters.length === 0) {
      setTab('table');
      return;
    }

    if (!selectedParameter || !parameters.some((parameter) => parameter.id === selectedParameter)) {
      setSelectedParameter(parameters[0].id);
    }
  }, [parameters]);

  useEffect(() => {
    if (StringIdentifierCollections.includes(layer.datasourceId)) {
      const id = getIdStore(feature);
      setId(id);
    } else {
      setId(location.id);
    }
  }, [layer, location, feature]);

  useEffect(() => {
    if (feature.properties) {
      if (typeof feature.properties === 'object') {
        const { times: rawTimes } = feature.properties as { times: string };

        const times = JSON.parse(rawTimes) as string[];

        if (
          times &&
          times.every((time) => typeof time === 'string') &&
          times.every((time) => dayjs(time).isValid())
        ) {
          setTimes(
            times.map((time) => ({ value: time, label: dayjs(time).format('MM/DD/YYYY h:mm A') }))
          );
        }
      } else if (typeof feature.properties === 'string') {
        const properties = JSON.parse(feature.properties);

        const { times: rawTimes } = properties as { times: string };

        const times = JSON.parse(rawTimes) as string[];

        if (
          times &&
          times.every((time) => typeof time === 'string') &&
          times.every((time) => dayjs(time).isValid())
        ) {
          setTimes(
            times.map((time) => ({ value: time, label: dayjs(time).format('MM/DD/YYYY h:mm A') }))
          );
        }
      }
    }
  }, [feature]);

  useEffect(() => {
    if (times.length === 0 || times.some((timeObj) => timeObj.value === time?.value)) {
      return;
    }

    const index = layer.paletteDefinition?.index ?? 0;

    setTime(times[index]);
  }, [times]);

  useEffect(() => {
    if (times.length === 0 || !time) {
      return;
    }
    const timeIndex = times.findIndex((timeObj) => timeObj.value === time?.value);
    if (timeIndex !== -1 && feature.properties) {
      const displayValues: { value: string; label: string; unit: string }[] = [];
      parameters.forEach((parameter) => {
        const rawValues = feature.properties![parameter.id];
        if (rawValues) {
          const values = JSON.parse(rawValues);
          const value = values[timeIndex];
          displayValues.push({
            label: parameter.name,
            value,
            unit: parameter.unit,
          });
        }
      });
      setDisplayValues(displayValues);
    }
  }, [feature, time, times]);

  useEffect(() => {
    if (!layer.paletteDefinition) {
      return;
    }

    setTime(times[layer.paletteDefinition.index]);
  }, [layer.paletteDefinition]);

  const parseBBox = (bbox: unknown): BBox | undefined => {
    if (
      typeof bbox === 'object' &&
      Array.isArray(bbox) &&
      bbox.every((coord) => typeof coord === 'number') &&
      bbox.length === 4
    ) {
      return normalizeBBox(bbox as BBox);
    } else if (typeof bbox === 'string') {
      const parsedBbox = JSON.parse(bbox);
      return parseBBox(parsedBbox);
    }
  };

  const getBBox = (feature: Feature): BBox | undefined => {
    const featureBBox = feature.bbox
      ? feature.bbox
      : feature.properties && feature.properties.bbox
        ? feature.properties.bbox
        : bbox(feature);

    return parseBBox(featureBBox);
  };

  const getData = (
    collectionId: ICollection['id'],
    locationId: LocationType['id'],
    params: IGetCubeParams,
    signal?: AbortSignal
  ) => {
    const location = locations.find((location) => location.id === locationId);

    if (location) {
      const bbox = getBBox(feature);
      if (bbox) {
        return awoService.getCube<CoverageCollection | CoverageJSON>(collectionId, {
          signal,
          params: { ...params, bbox },
        });
      }
    }

    console.error('Location without bbox detected: ', location);

    // Stub collection to resolve type issues
    // This statement should never be reached
    return {
      type: 'CoverageCollection',
      domainType: 'PointSeries',
      coverages: [],
      parameters: {},
    } as CoverageCollection;
  };

  // const getData = (
  //   collectionId: ICollection['id'],
  //   _locationId: LocationType['id'],
  //   params: IGetCubeParams,
  //   signal?: AbortSignal
  // ) => {

  //   const normalizedBBox = normalizeBBox(bbox(feature));

  //   return awoService.getCube<CoverageCollection | CoverageJSON>(collectionId, {
  //     signal,
  //     params: { ...params, bbox: normalizedBBox },
  //   });
  // };

  const onData = (data?: TWrappedCoverage[]) => {
    if (data && data.every((wrappedCoverage) => wrappedCoverage.data === null)) {
      setChartDisabled(true);
      setTab('table');
    }
  };

  return (
    <>
      <Divider mt="calc(var(--default-spacing) / 2)" />

      <Box style={{ display: tab === 'chart' ? 'block' : 'none' }}>
        {parameters.length > 0 && id && selectedParameter && (
          <Charts
            collectionId={layer.datasourceId}
            locationIds={[id]}
            parameters={parameters}
            from={layer.from}
            to={layer.to}
            getData={getData}
            value={selectedParameter}
            className={styles.chartWrapper}
            onData={onData}
          />
        )}
      </Box>
      <Box style={{ display: tab === 'table' ? 'block' : 'none' }} className={styles.tableWrapper}>
        {time && (
          <Text size="sm" mt="calc(var(--default-spacing) * 2)" mb="var(--default-spacing)">
            {time?.label}
          </Text>
        )}

        <ScrollArea scrollbars="x" type="hover" style={{ maxWidth: '100%' }}>
          <Group
            justify="flex-start"
            align="flex-start"
            mb="calc(var(--default-spacing) * 2)"
            wrap="nowrap"
          >
            {displayValues.map((displayValue) => (
              <Stack
                key={`${location.id}-${displayValue.label}-${displayValue.value}`}
                gap="var(--default-spacing)"
                miw={120}
              >
                <Text size="sm" fw={700}>
                  {displayValue.label}
                </Text>
                <Text size="xs">
                  {displayValue.value} ({displayValue.unit})
                </Text>
              </Stack>
            ))}
          </Group>
        </ScrollArea>
      </Box>

      <Stack justify="space-between" mt="var(--default-spacing)" mb="var(--default-spacing)">
        <Group gap="var(--default-spacing)" align="flex-end">
          {locations.length > 1 && (
            <Select
              className={styles.locationsDropdown}
              size="xs"
              label="Locations"
              searchable
              data={locations.map((location) => location.id)}
              value={location.id}
              onChange={(value, _option) => handleLocationChange(value)}
            />
          )}
          {times.length > 1 && time && (
            <Select
              className={styles.timesDropdown}
              size="xs"
              label="Times"
              searchable
              data={times}
              value={time.value}
              onChange={(_value, option) => setTime(option)}
            />
          )}
        </Group>
        <Group gap="var(--default-spacing)" align="flex-end" justify="space-between">
          <Group gap="calc(var(--default-spacing) / 2)">
            {!chartDisabled ? (
              <Button
                size="xs"
                onClick={() => setTab('chart')}
                variant={tab === 'chart' ? Variant.Selected : Variant.Secondary}
              >
                Chart
              </Button>
            ) : (
              <Tooltip label="Select one or more parameters in the layer controls to enable charts.">
                <Button size="xs" disabled data-disabled>
                  Chart
                </Button>
              </Tooltip>
            )}

            <Button
              size="xs"
              onClick={() => setTab('table')}
              variant={tab === 'table' ? Variant.Selected : Variant.Secondary}
            >
              Values
            </Button>
          </Group>

          <Tooltip label="Open this location in the Download modal.">
            <Button size="xs" onClick={handleLinkClick} variant={Variant.Primary}>
              Download
            </Button>
          </Tooltip>
        </Group>
      </Stack>
    </>
  );
};
