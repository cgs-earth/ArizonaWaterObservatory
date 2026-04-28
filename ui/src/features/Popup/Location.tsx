/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { Box, Group, Stack, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Charts } from '@/features/Charts';
import { Parameter } from '@/features/Popup';
import styles from '@/features/Popup/Popup.module.css';
import Table from '@/features/Table';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetLocationParams,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { getIdStore } from '@/utils/getIdStore';

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

export const Location: React.FC<Props> = (props) => {
  const {
    location,
    locations,
    feature,
    layer,
    datasetName,
    parameters,
    handleLocationChange,
    handleLinkClick,
  } = props;

  const [tab, setTab] = useState<'chart' | 'table'>('chart');
  const [id, setId] = useState<string>();
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
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

  const getData = useCallback(
    (
      collectionId: ICollection['id'],
      locationId: LocationType['id'],
      params: IGetLocationParams,
      signal?: AbortSignal
    ) =>
      awoService.getLocation<CoverageCollection | CoverageJSON>(collectionId, locationId, {
        signal,
        params,
      }),
    []
  );

  const onLoading = (isLoading: boolean) => {
    if (isMounted.current) {
      setIsLoading(isLoading);
    }
  };

  return (
    <>
      <Box style={{ display: tab === 'chart' ? 'block' : 'none' }}>
        {datasetName.length > 0 && parameters.length > 0 && selectedParameter && id && (
          <Charts
            collectionId={layer.datasourceId}
            locationIds={[id]}
            parameters={parameters}
            from={layer.from}
            to={layer.to}
            getData={getData}
            onLoading={onLoading}
            value={selectedParameter}
            className={styles.chartWrapper}
          />
        )}
      </Box>
      <Box style={{ display: tab === 'table' ? 'block' : 'none' }} className={styles.tableWrapper}>
        {feature && <Table size="xs" properties={feature.properties} />}
      </Box>
      <Stack
        gap="calc(var(--default-spacing) * 2)"
        mt="var(--default-spacing)"
        mb="var(--default-spacing)"
      >
        <Group gap="var(--default-spacing)" align="flex-end">
          {locations.length > 1 && (
            <Select
              className={styles.locationsDropdown}
              size="xs"
              label="Locations"
              disabled={isLoading}
              searchable
              data={locations.map((location) => location.id)}
              value={location.id}
              onChange={(value, _option) => handleLocationChange(value)}
            />
          )}
          {parameters.length > 0 && tab === 'chart' && (
            <Select
              className={styles.parametersDropdown}
              size="xs"
              label="Parameters"
              disabled={isLoading}
              searchable
              data={parameters.map((parameter) => ({
                value: parameter.id,
                label: `${parameter.name} (${parameter.unit})`,
              }))}
              value={selectedParameter}
              onChange={setSelectedParameter}
              clearable={false}
            />
          )}
        </Group>
        <Group gap="var(--default-spacing)" align="flex-end">
          {parameters.length > 0 ? (
            <Button
              size="xs"
              onClick={() => setTab('chart')}
              variant={tab === 'chart' ? Variant.Selected : Variant.Secondary}
            >
              Chart
            </Button>
          ) : (
            <Tooltip label="Select one or more parameters in the layer controls to enable charts.">
              <Button size="xs" variant={Variant.Secondary} disabled data-disabled>
                Chart
              </Button>
            </Tooltip>
          )}

          <Button
            size="xs"
            onClick={() => setTab('table')}
            variant={tab === 'table' ? Variant.Selected : Variant.Secondary}
          >
            Properties
          </Button>
          <Box component="span" className={styles.linkButtonWrapper}>
            {parameters.length > 0 ? (
              <Tooltip label="Open this location in the Links modal.">
                <Button size="xs" onClick={handleLinkClick} variant={Variant.Primary}>
                  Export
                </Button>
              </Tooltip>
            ) : (
              <Tooltip label="Select one or more parameters in the layer controls to access the Export modal.">
                <Button size="xs" variant={Variant.Primary} disabled data-disabled>
                  Export
                </Button>
              </Tooltip>
            )}
          </Box>
        </Group>
      </Stack>
    </>
  );
};
