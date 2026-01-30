/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Anchor, Box, Group, Text, Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import { Download } from '@/features/TopBar/Links/Download';
import { Header } from '@/features/TopBar/Links/Header';
import { LayerBlock } from '@/features/TopBar/Links/LayerBlock';
import styles from '@/features/TopBar/TopBar.module.css';
import { useLocations } from '@/hooks/useLocations';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import { Layer as LayerType, Location } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getProvider } from '@/utils/provider';
import { buildCubeUrl, buildItemsUrl, buildLocationsUrl } from '@/utils/url';

type Props = {
  layer: LayerType;
  linkLocation: Location | null;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer, linkLocation } = props;

  const { selectedLocations, otherLocations } = useLocations(layer);

  const [dataset, setDataset] = useState<ICollection>();
  const [provider, setProvider] = useState<string>('');
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);
  const [url, setUrl] = useState('');

  const [isEnabled, setIsEnabled] = useState(false);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

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
    if (!dataset) {
      return;
    }

    let url = '';
    if (collectionType === CollectionType.EDR) {
      url = buildLocationsUrl(dataset.id, layer.parameters);
    } else if (collectionType === CollectionType.EDRGrid) {
      const bbox = mainManager.getBBox(dataset.id);
      url = buildCubeUrl(
        dataset.id,
        layer.parameters,
        layer.from,
        layer.to,
        false,
        true,
        undefined,
        bbox
      );
    } else if (collectionType === CollectionType.Features) {
      url = buildItemsUrl(dataset.id);
    }

    setUrl(url);
  }, [dataset, collectionType]);

  useEffect(() => {
    const datasource = mainManager.getDatasource(layer.datasourceId);
    if (datasource) {
      const collectionType = getCollectionType(datasource);
      if (collectionType === CollectionType.Features) {
        return setIsEnabled(true);
      } else if ([CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType)) {
        return setIsEnabled(layer.parameters.length > 0);
      }
    }
    setIsEnabled(false);
  }, [layer]);

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

  const hasSelectedLocations = selectedLocations.length > 0;
  const hasOtherLocations = otherLocations.length > 0;

  // This is a raster layer with no underlying data
  if (collectionType === CollectionType.Map) {
    return null;
  }

  return (
    <>
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
            control: [CollectionType.EDR, CollectionType.Features].includes(collectionType) ? (
              <Download collectionId={layer.datasourceId} />
            ) : null,
            content: (
              <Box className={styles.accordionBody}>
                <Header
                  url={url}
                  isLoading={false}
                  collectionType={collectionType}
                  onGetAllCSV={() => null}
                />
                {!isEnabled || (!hasSelectedLocations && !hasOtherLocations) ? (
                  <Group justify="center" align="center" className={styles.noParameterMessage}>
                    <Text size="md">
                      {!isEnabled
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
                                {selectedLocations.length > 0 && 'Other '}
                                {getLabel(collectionType)}s
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
    </>
  );
};
