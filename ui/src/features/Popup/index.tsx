/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Box, Group, Stack, Text, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import { Variant } from '@/components/types';
import { Chart } from '@/features/Popup/Chart';
import styles from '@/features/Popup/Popup.module.css';
import { Table } from '@/features/TopBar/Links/Table';
import mainManager from '@/managers/Main.init';
import { Layer, Location } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

type Props = {
  location: Location;
  feature: Feature;
  close: () => void;
};

export const Popup: React.FC<Props> = (props) => {
  const { location, feature } = props;

  const [layer, setLayer] = useState<Layer | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [parameters, setParameters] = useState<string[]>([]);
  const [tab, setTab] = useState<'chart' | 'table'>('chart');

  const setLinkLocation = useSessionStore((state) => state.setLinkLocation);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  useEffect(() => {
    const layer = mainManager.getLayer(location.layerId);
    if (layer) {
      setLayer(layer);
    }
  }, [location]);

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
        setTab('table');
      }

      setParameters(parameters);
    }
  }, [location, layer]);

  const handleLinkClick = () => {
    setLinkLocation(location);
    setOverlay(Overlay.Links);
  };

  if (!layer) {
    return null;
  }

  return (
    <Stack gap={0} className={styles.popupWrapper}>
      <Text size="lg" fw={700}>
        Location Id: {location.id}
      </Text>
      <Text size="sm">{datasetName}</Text>
      <Box style={{ display: tab === 'chart' ? 'block' : 'none' }}>
        {layer && datasetName.length > 0 && parameters.length > 0 && (
          <Chart
            collectionId={layer.datasourceId}
            locationId={location.id}
            title={datasetName}
            parameters={parameters}
            from={layer.from}
            to={layer.to}
          />
        )}
      </Box>
      <Box style={{ display: tab === 'table' ? 'block' : 'none' }} className={styles.tableWrapper}>
        <Table size="xs" properties={feature.properties} />
      </Box>
      <Group justify="space-between" mt={8} mb={8}>
        <Group gap={8}>
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
        </Group>
        {parameters.length > 0 ? (
          <Tooltip label="Open this location in the Links modal.">
            <Button size="xs" onClick={handleLinkClick} variant={Variant.Primary}>
              Link
            </Button>
          </Tooltip>
        ) : (
          <Tooltip label="Select one or more parameters in the layer controls to access links modal.">
            <Button size="xs" variant={Variant.Primary} disabled data-disabled>
              Link
            </Button>
          </Tooltip>
        )}
      </Group>
    </Stack>
  );
};
