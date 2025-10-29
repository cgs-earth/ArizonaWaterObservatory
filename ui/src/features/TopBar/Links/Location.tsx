/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { forwardRef, useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Collapse, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Code from '@/components/Code';
import CopyInput from '@/components/CopyInput';
import { Variant } from '@/components/types';
import { Chart } from '@/features/Popup/Chart';
import { GeoJSON } from '@/features/TopBar/Links/GeoJSON';
import { Table } from '@/features/TopBar/Links/Table';
import styles from '@/features/TopBar/TopBar.module.css';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { buildUrl } from '@/utils/url';

type Props = {
  location: Feature;
  collection: ICollection;
  layer: Layer;
  linkLocation?: LocationType | null;
};

export const Location = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { location, layer, collection, linkLocation } = props;

  const [openedProps, { toggle: toggleProps }] = useDisclosure(false);
  const [openedGeo, { toggle: toggleGeo }] = useDisclosure(false);
  const [openedChart, { toggle: toggleChart, close: closeChart }] = useDisclosure(false);

  const [url, setUrl] = useState('');
  const [codeUrl, setCodeUrl] = useState('');
  const [datasetName, setDatasetName] = useState<string>('');
  const [parameters, setParameters] = useState<string[]>([]);

  const [from, setFrom] = useState<string | null>(layer.from);
  const [to, setTo] = useState<string | null>(layer.to);

  useEffect(() => {
    const url = buildUrl(
      collection.id,
      String(location.id),
      layer.parameters,
      from,
      to,
      false,
      true
    );

    const codeUrl = buildUrl(
      collection.id,
      String(location.id),
      layer.parameters,
      from,
      to,
      false,
      false
    );

    setUrl(url);
    setCodeUrl(codeUrl);
  }, [from, to]);

  useEffect(() => {
    if (!layer) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset) {
      setDatasetName(newDataset.title ?? '');
      const paramObjects = Object.values(newDataset?.parameter_names ?? {});

      const parameters = paramObjects
        .filter((object) => layer.parameters.includes(object.id))
        .map((object) => object.name);

      if (parameters.length === 0) {
        closeChart();
      }

      setParameters(parameters);
    }
  }, [location, layer]);

  const code = `curl -X GET ${codeUrl} \n
-H "Content-Type: application/json"`;

  return (
    <Paper
      ref={ref}
      shadow="xl"
      className={`${styles.locationWrapper} ${linkLocation && linkLocation?.id === location?.id ? styles.highlightLocation : ''}`}
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
          <Group gap={8}>
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
            {parameters.length > 0 ? (
              <Button
                size="xs"
                variant={openedChart ? Variant.Selected : Variant.Secondary}
                className={styles.propertiesButton}
                onClick={toggleChart}
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
          </Group>
          <Group gap={16} align="flex-end">
            <DatePickerInput
              label="From"
              size="sm"
              className={styles.datePicker}
              placeholder="Pick start date"
              value={from}
              onChange={setFrom}
              clearable
              // error={isValidRange ? false : "Invalid date range"}
            />
            <DatePickerInput
              label="To"
              size="sm"
              className={styles.datePicker}
              placeholder="Pick end date"
              value={to}
              onChange={setTo}
              clearable
              // error={isValidRange ? false : "Invalid date range"}
            />
          </Group>
        </Group>
        <Stack>
          {openedChart && (
            <Collapse in={openedChart}>
              <Chart
                className={styles.linksChart}
                collectionId={layer.datasourceId}
                locationId={String(location.id)}
                title={datasetName}
                parameters={parameters}
                from={from}
                to={to}
              />
            </Collapse>
          )}
          <Group align="flex-start" gap={16} grow>
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
