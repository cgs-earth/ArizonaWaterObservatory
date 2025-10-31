/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Box, Group, Text, Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import { LayerBlock } from '@/features/TopBar/Links/LayerBlock';
import styles from '@/features/TopBar/TopBar.module.css';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer as LayerType, Location } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getProvider } from '@/utils/provider';

type Props = {
  layer: LayerType;
  linkLocation: Location | null;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer, linkLocation } = props;

  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState<Feature[]>([]);
  const [otherLocations, setOtherLocations] = useState<Feature[]>([]);
  const [dataset, setDataset] = useState<ICollection>();
  const [provider, setProvider] = useState<string>('');
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

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

      const allLocations = await mainManager.getFeatures(layer, controller.current.signal);

      const layerLocations = locations.filter((location) => location.layerId === layer.id);

      const selectedLocations = allLocations.features.filter((feature) =>
        layerLocations.some((location) => location.id === String(feature.id))
      );
      const otherLocations = allLocations.features.filter(
        (feature) => !layerLocations.some((location) => location.id === String(feature.id))
      );

      if (isMounted.current) {
        setSelectedLocations(selectedLocations);
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
    void getOtherLocations();
  }, []);

  useEffect(() => {
    if (dataset) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset) {
      setDataset(newDataset);
      const collectionType = getCollectionType(newDataset);
      setCollectionType(collectionType);
    }
  }, [layer]);

  useEffect(() => {
    if (!dataset || provider.length > 0) {
      return;
    }

    const newProvider = getProvider(dataset.id);
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

  const getLabel = (collectionType: CollectionType) => {
    switch (collectionType) {
      case CollectionType.EDR:
        return 'Location';
      case CollectionType.EDRGrid:
        return 'Grid';
      case CollectionType.Features:
        return 'Item';
      default:
        return '';
    }
  };

  const hasParametersSelected = layer.parameters.length > 0;
  const hasSelectedLocations = selectedLocations.length > 0;
  const hasOtherLocations = otherLocations.length > 0;

  return (
    <Accordion
      defaultValue={`links-${linkLocation?.layerId}-accordion`}
      items={[
        {
          id: `links-${layer.id}-accordion`,

          title: (
            <Box className={styles.accordionHeader}>
              <Group gap="xs">
                {provider.length > 0 && (
                  <Text size="sm" fw={700}>
                    {provider}
                  </Text>
                )}
                <Text size="sm">{dataset?.title}</Text>
              </Group>
              {alternateLink ? (
                <Anchor
                  title="This dataset in the API"
                  href={alternateLink}
                  target="_blank"
                  className={styles.link}
                >
                  <Title order={5} size="h3">
                    {layer.name}
                  </Title>
                </Anchor>
              ) : (
                <Title order={5} size="h3">
                  {layer.name}
                </Title>
              )}
            </Box>
          ),
          content: (
            <Box className={styles.accordionBody}>
              {!hasParametersSelected || (!hasSelectedLocations && !hasOtherLocations) ? (
                <Group justify="center" align="center" className={styles.noParameterMessage}>
                  <Text size="md">
                    {!hasParametersSelected
                      ? 'Select at least one parameter for this layer to access links.'
                      : 'No locations found.'}
                  </Text>
                </Group>
              ) : (
                <>
                  {selectedLocations.length > 0 && (
                    <Accordion
                      defaultValue={`links-${linkLocation?.layerId}-selected-accordion`}
                      items={[
                        {
                          id: `links-${layer.id}-selected-accordion`,
                          title: (
                            <Title order={6} size="h4" className={styles.accordionHeader}>
                              {otherLocations.length > 0 && 'Selected '}
                              {getLabel(collectionType)}s
                            </Title>
                          ),
                          content: (
                            <LayerBlock
                              linkLocation={linkLocation}
                              locations={selectedLocations}
                              layer={layer}
                              collection={dataset}
                              collectionType={collectionType}
                            />
                          ),
                        },
                      ]}
                      variant={Variant.Secondary}
                    />
                  )}
                  {otherLocations.length > 0 && (
                    <Accordion
                      items={[
                        {
                          id: `links-${layer.id}-other-accordion`,
                          title: (
                            <Title order={6} size="h4" className={styles.accordionHeader}>
                              {selectedLocations.length > 0 && 'Other '}Locations
                            </Title>
                          ),
                          content: (
                            <LayerBlock
                              locations={otherLocations}
                              layer={layer}
                              collection={dataset}
                              collectionType={collectionType}
                            />
                          ),
                        },
                      ]}
                      variant={Variant.Secondary}
                    />
                  )}
                </>
              )}
            </Box>
          ),
        },
      ]}
      variant={Variant.Primary}
    />
  );
};
