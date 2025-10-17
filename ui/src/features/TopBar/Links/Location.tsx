/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Group, Paper, Stack, Text } from '@mantine/core';
import Code from '@/components/Code';
import CopyInput from '@/components/CopyInput';
import styles from '@/features/TopBar/TopBar.module.css';
import { ICollection } from '@/services/edr.service';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { buildUrl } from '@/utils/url';

type Props = {
  location: LocationType | Feature;
  collection: ICollection;
  layer: Layer;
  provider: string;
};

export const Location: React.FC<Props> = (props) => {
  const { location, layer, collection, provider } = props;

  const [url, setUrl] = useState('');
  const [codeUrl, setCodeUrl] = useState('');

  useEffect(() => {
    const url = buildUrl(
      collection.id,
      String(location.id),
      layer.parameters,
      layer.from,
      layer.to,
      false,
      true
    );

    const codeUrl = buildUrl(
      collection.id,
      String(location.id),
      layer.parameters,
      layer.from,
      layer.to,
      false,
      false
    );

    setUrl(url);
    setCodeUrl(codeUrl);
  }, []);

  const code = `curl -X GET ${codeUrl} \n
-H "Content-Type: application/json"`;

  return (
    <Paper shadow="lg" className={styles.locationWrapper}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Stack gap={0}>
            <Group gap="xs">
              {provider.length > 0 && (
                <Text size="sm" fw={700}>
                  {provider}
                </Text>
              )}
              <Text size="sm">{collection.title}</Text>
            </Group>
            <Group gap="xs">
              <Text size="md" fw={700}>
                {layer.name}
              </Text>
              <Text size="md">{location.id}</Text>
            </Group>
          </Stack>
          {/* <Checkbox
            size="xs"
            label="Include Parameters"
            checked={includeParameters}
            onChange={(event) => setIncludeParameters(event.currentTarget.checked)}
          /> */}
        </Group>
        <CopyInput size="xs" className={styles.copyInput} url={url} />
        <Code size="xs" code={code} />
        <Anchor
          title="This location in the API"
          href={`${collection.data_queries.locations?.link?.href}/${location.id}`}
          target="_blank"
        >
          API
        </Anchor>
      </Stack>
    </Paper>
  );
};
