/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { forwardRef, useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Collapse, Group, Paper, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Code from '@/components/Code';
import CopyInput from '@/components/CopyInput';
import { Variant } from '@/components/types';
import { GeoJSON } from '@/features/TopBar/Links/GeoJSON';
import { Table } from '@/features/TopBar/Links/Table';
import styles from '@/features/TopBar/TopBar.module.css';
import { ICollection } from '@/services/edr.service';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { buildItemUrl } from '@/utils/url';

dayjs.extend(isSameOrBefore);

type Props = {
  location: Feature;
  collection: ICollection;
  layer: Layer;
  linkLocation?: LocationType | null;
};

export const Item = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { location, layer, collection, linkLocation } = props;

  const [openedProps, { toggle: toggleProps }] = useDisclosure(false);
  const [openedGeo, { toggle: toggleGeo }] = useDisclosure(false);

  const [url, setUrl] = useState('');
  const [codeUrl, setCodeUrl] = useState('');

  useEffect(() => {
    const url = buildItemUrl(collection.id, String(location.id), false, false);

    const codeUrl = buildItemUrl(collection.id, String(location.id), false, false);

    setUrl(url);
    setCodeUrl(codeUrl);
  }, [location]);

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
          <Anchor title="This item in the API" href={url} target="_blank">
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
          </Group>
        </Group>
        <Stack>
          <Group align="flex-start" gap={16} grow>
            {openedProps && (
              <Collapse in={openedProps}>
                <Table properties={location.properties} search />
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
