/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { bbox } from '@turf/turf';
import { BBox, Feature } from 'geojson';
import { Anchor, Collapse, ComboboxData, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Code from '@/components/Code';
import CopyInput from '@/components/CopyInput';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Charts } from '@/features/Charts';
import { Parameter } from '@/features/Popup';
import Table from '@/features/Table';
import { GeoJSON } from '@/features/TopBar/Links/GeoJSON';
import styles from '@/features/TopBar/Links/Links.module.css';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import mainManager from '@/managers/Main.init';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetCubeParams,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { getIdStore } from '@/utils/getIdStore';
import { normalizeBBox } from '@/utils/normalizeBBox';
import { getParameterUnit } from '@/utils/parameters';
import { buildCubeUrl } from '@/utils/url';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: Layer;
  isLoading: boolean;
  collection: ICollection;
  location: Feature;
  linkLocation?: LocationType | null;
  collectionType: CollectionType;
  parameterOptions: ComboboxData | undefined;
};
export const Grid = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const [openedProps, { toggle: toggleProps }] = useDisclosure(false);
  const [openedGeo, { toggle: toggleGeo }] = useDisclosure(false);
  const [openedCharts, { toggle: toggleCharts, close: closeCharts }] = useDisclosure(false);

  const [url, setUrl] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [_datasetName, setDatasetName] = useState<string>('');

  const isMounted = useRef(true);
  const { layer, location, collection, collectionType, parameterOptions, linkLocation } = props;
  const [isLoading, setIsLoading] = useState(false);

  const { getDateInputError, getIsDateRangeOverLimit } = useLayerValidation(layer, isLoading, {
    parameterOptions,
    collectionType,
  });
  const [id, setId] = useState<string>(String(location.id));
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [from, setFrom] = useState<string | null>(layer.from);
  const [to, setTo] = useState<string | null>(layer.to);

  useEffect(() => {
    const url = buildCubeUrl(collection.id, layer.parameters, from, to, false, true, location);

    const codeUrl = buildCubeUrl(collection.id, layer.parameters, from, to, false, false, location);

    setUrl(url);
    setCodeUrl(codeUrl);
  }, [from, to]);

  useEffect(() => {
    if (!layer) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset && !getIsDateRangeOverLimit()) {
      setDatasetName(newDataset.title ?? '');
      const paramObjects = Object.values(newDataset?.parameter_names ?? {});

      const parameters = paramObjects
        .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
        .map((object) => ({
          id: object.id,
          name: object.observedProperty.label.en,
          unit: getParameterUnit(object),
        }));

      if (parameters.length === 0) {
        closeCharts();
      }

      setParameters(parameters);
    }

    if (StringIdentifierCollections.includes(layer.datasourceId)) {
      const id = getIdStore(location);
      if (id) {
        setId(id);
      } else {
        setId(String(location.id));
      }
    } else {
      setId(String(location.id));
    }
  }, [location, layer]);

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
    _locationId: LocationType['id'],
    params: IGetCubeParams,
    signal?: AbortSignal
  ) => {
    const bbox = getBBox(location);
    if (bbox) {
      return awoService.getCube<CoverageCollection | CoverageJSON>(collectionId, {
        signal,
        params: { ...params, bbox },
      });
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

  const onLoading = (isLoading: boolean) => {
    if (isMounted.current) {
      setIsLoading(isLoading);
    }
  };

  const code = `curl -X GET ${codeUrl} \n
-H "Content-Type: application/json"`;

  return (
    <Paper
      ref={ref}
      shadow="xl"
      className={`${styles.locationWrapper} ${linkLocation && linkLocation.id === String(location?.id) ? styles.highlightLocation : ''}`}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Text size="md" fw={700}>
              {layer.name}
            </Text>
            <Text size="md">{location.id}</Text>
          </Group>
          <Anchor
            title="This location in the API"
            href={`${collection.data_queries.locations?.link?.href}/${location.id}`}
            target="_blank"
          >
            API
          </Anchor>
        </Group>
        <CopyInput size="xs" className={styles.copyInput} url={url} />
        <Code size="xs" code={code} />
        <Group justify="space-between" align="flex-end">
          <Group gap="var(--default-spacing)">
            <Button
              size="xs"
              variant={openedProps ? Variant.Selected : Variant.Secondary}
              className={styles.propertiesButton}
              onClick={toggleProps}
            >
              Properties
            </Button>
            <Button
              size="xs"
              variant={openedGeo ? Variant.Selected : Variant.Secondary}
              className={styles.propertiesButton}
              onClick={toggleGeo}
            >
              GeoJSON
            </Button>
            <Tooltip
              label="Select one or more parameters in the layer controls to enable charts."
              disabled={parameters.length > 0}
            >
              <Button
                size="xs"
                className={styles.propertiesButton}
                onClick={toggleCharts}
                variant={openedCharts ? Variant.Selected : Variant.Secondary}
                disabled={parameters.length === 0}
                {...(parameters.length === 0 ? { 'data-disabled': true } : {})}
              >
                Chart
              </Button>
            </Tooltip>
            {/* <Tooltip
              label={
                isLoading
                  ? 'Please wait for download to finish.'
                  : 'Download the parameter data in CSV format.'
              }
            >
              <Button
                size="xs"
                disabled={isLoading}
                data-disabled={isLoading}
                className={styles.propertiesButton}
                onClick={handleCSVClick}
              >
                CSV
              </Button>
            </Tooltip> */}
          </Group>
          <Group gap="calc(var(--default-spacing) * 2)" align="flex-end">
            <DateInput
              label="From"
              size="xs"
              className={styles.datePicker}
              placeholder="Pick start date"
              value={from}
              onChange={setFrom}
              simplePresets={[
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              clearable
              disabled={isLoading}
              error={getDateInputError()}
            />
            <DateInput
              label="To"
              size="xs"
              className={styles.datePicker}
              placeholder="Pick end date"
              value={to}
              onChange={setTo}
              simplePresets={[
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              clearable
              disabled={isLoading}
              error={getDateInputError()}
            />
          </Group>
        </Group>
        <Stack>
          {openedCharts && parameters.length > 0 && (
            <Collapse in={openedCharts}>
              <Charts
                className={styles.linksChart}
                collectionId={layer.datasourceId}
                locationIds={[id]}
                parameters={parameters}
                from={from}
                to={to}
                getData={getData}
                tabs
                onLoading={onLoading}
              />
            </Collapse>
          )}
          <Group align="flex-start" gap="calc(var(--default-spacing) * 2)" grow>
            {openedProps && (
              <Collapse in={openedProps}>
                <Table properties={location.properties} />
              </Collapse>
            )}
            {openedGeo && (
              <Collapse in={openedGeo}>
                <GeoJSON location={location} />
              </Collapse>
            )}
          </Group>
        </Stack>
      </Stack>
    </Paper>
  );
});
