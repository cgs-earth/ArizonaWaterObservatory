/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Collapse, Group, Paper, Stack, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Code from '@/components/Code';
import CopyInput from '@/components/CopyInput';
import { Variant } from '@/components/types';
import { GeoJSON } from '@/features/TopBar/Links/GeoJSON';
import { Table } from '@/features/TopBar/Links/Table';
import styles from '@/features/TopBar/TopBar.module.css';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';
import { buildUrl } from '@/utils/url';

type Props = {
  location: Feature;
  collection: ICollection;
  layer: Layer;
  provider: string;
};

export const Location: React.FC<Props> = (props) => {
  const { location, layer, collection, provider } = props;

  const [openedProps, { toggle: toggleProps }] = useDisclosure(false);
  const [openedGeo, { toggle: toggleGeo }] = useDisclosure(false);

  const [url, setUrl] = useState('');
  const [codeUrl, setCodeUrl] = useState('');

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

  const code = `curl -X GET ${codeUrl} \n
-H "Content-Type: application/json"`;

  return (
    <Paper shadow="xl" className={styles.locationWrapper}>
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
        <Group justify="space-between">
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
    </Paper>
  );
};
