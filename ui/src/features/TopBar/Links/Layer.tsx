/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Box, Collapse, Divider, Group, Stack, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import { Variant } from '@/components/types';
import styles from '@/features/TopBar/TopBar.module.css';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer as LayerType, Location as LocationType } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';
import { getProvider } from '@/utils/provider';
import { Location } from './Location';

type Props = {
  layer: LayerType;
  open: boolean;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer, open } = props;

  const [opened, { toggle }] = useDisclosure(open);

  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState<LocationType[]>([]);
  const [otherLocations, setOtherLocations] = useState<Feature[]>([]);
  const [dataset, setDataset] = useState<ICollection>();
  const [provider, setProvider] = useState<string>('');

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  // Get all non-selected locations, rendered or not on map
  const getOtherLocations = async () => {
    const loadingInstance = loadingManager.add(
      `Fetching locations for: ${layer.name}`,
      LoadingType.Locations
    );
    try {
      controller.current = new AbortController();

      const allLocations = await mainManager.getData(layer, controller.current.signal);

      const otherLocations = allLocations.features.filter(
        (feature) => !selectedLocations.some((location) => location.id === feature.id)
      );

      if (isMounted.current) {
        console.log('set otherLocations');
        setOtherLocations(otherLocations);
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    const selectedLocations = locations.filter((location) => location.layerId === layer.id);
    setSelectedLocations(selectedLocations);
  }, [locations]);

  useEffect(() => {
    void getOtherLocations();
  }, [selectedLocations]);

  useEffect(() => {
    if (dataset) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset) {
      console.log('set dataset');
      setDataset(newDataset);
    }
  }, [layer]);

  useEffect(() => {
    if (!dataset || provider.length > 0) {
      return;
    }

    const newProvider = getProvider(dataset.id);
    console.log('set provider');
    setProvider(newProvider);
  }, [dataset]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  const alternateLink = dataset?.links?.find(
    (link) => link.rel === 'alternate' && link.type === 'text/html'
  )?.href;

  return (
    <>
      <Box p="lg">
        <Group justify="space-between" mb="sm" className={styles.locationHeader}>
          {/* TODO: figure out header level */}
          {alternateLink ? (
            <Anchor title="This dataset in the API" href={alternateLink} target="_blank">
              <Title order={5} size="h3">
                {layer.name}
              </Title>
            </Anchor>
          ) : (
            <Title order={5} size="h3">
              {layer.name}
            </Title>
          )}
          <Button size="sm" onClick={toggle} variant={Variant.Primary}>
            {opened ? 'Hide' : 'Show'}
          </Button>
        </Group>
        <Collapse in={opened}>
          <Divider />
          {selectedLocations.length > 0 && (
            <Stack component="section" mt="sm">
              <Title order={6}>Selected Locations</Title>
              {dataset &&
                selectedLocations.map((location) => (
                  <Location
                    key={`selected-location-${layer.id}-${location.id}`}
                    location={location}
                    layer={layer}
                    collection={dataset}
                    provider={provider}
                  />
                ))}
            </Stack>
          )}
          {selectedLocations.length > 0 && otherLocations.length > 0 && <Divider />}
          <Stack component="section" mt="sm">
            <Title order={6} size="h4">
              Unselected Locations
            </Title>
            {dataset &&
              otherLocations.map((location) => (
                <Location
                  key={`unselected-location-${layer.id}-${location.id}`}
                  location={location}
                  layer={layer}
                  collection={dataset}
                  provider={provider}
                />
              ))}
          </Stack>
        </Collapse>
      </Box>
    </>
  );
};
