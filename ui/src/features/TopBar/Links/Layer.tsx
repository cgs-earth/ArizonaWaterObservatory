/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Feature } from 'geojson';
import { Anchor, Box, Divider, Flex, Group, Stack, Text, Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Download } from '@/features/TopBar/Links/Download';
import { LayerBlock } from '@/features/TopBar/Links/LayerBlock';
import styles from '@/features/TopBar/Links/Links.module.css';
import { Menu } from '@/features/TopBar/Links/Menu';
import { useLocations } from '@/hooks/useLocations';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer as LayerType } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getIdStore } from '@/utils/getIdStore';
import { getLabel } from '@/utils/getLabel';
import { hasSearchTerm } from '@/utils/searchFeatures';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: LayerType;
  open?: boolean;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const linkLocation = useSessionStore((state) => state.linkLocation);
  const searches = useMainStore((state) => state.searches);

  const { selectedLocations: mapLocations, otherLocations } = useLocations(layer);

  const [collection, setCollection] = useState<ICollection>();
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

  const [collectionLink, setCollectionLink] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [documentationLink, setDocumentationLink] = useState('');

  const [locations, setLocations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [hasParameters, setHasParameters] = useState(false);

  useEffect(() => {
    const search = searches.find((search) => search.layerId === layer.id);

    if (search) {
      setSearchTerm(search.searchTerm);
    }
  }, [searches]);

  useEffect(() => {
    if (linkLocation && linkLocation.layerId === layer.id) {
      setLocations([...locations, linkLocation.id]);
    }
  }, [linkLocation]);

  useEffect(() => {
    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const collectionType = getCollectionType(collection);

      const collectionLink =
        collection.links.find((link) => link.rel === 'alternate' && link.type === 'text/html')
          ?.href ?? '';
      const sourceLink = collection.links.find((link) => link.rel === 'canonical')?.href ?? '';
      const documentationLink =
        collection.links.find((link) => link.rel === 'documentation')?.href ?? '';

      setCollectionLink(collectionLink);
      setSourceLink(sourceLink);
      setDocumentationLink(documentationLink);

      setCollectionType(collectionType);
      setCollection(collection);
    }
  }, [layer.datasourceId]);

  useEffect(() => {
    if (collectionType === CollectionType.Features) {
      setHasParameters(true);
    } else if ([CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType)) {
      setHasParameters(layer.parameters.length > 0);
    }
  }, [layer, collectionType]);

  const addLocation = (locationId: string) => {
    if (!locations.some((location) => location === locationId)) {
      setLocations([...locations, locationId]);
    }
  };

  const removeLocation = (locationId: string) => {
    const filteredLocations = locations.filter((location) => location !== locationId);
    setLocations(filteredLocations);
  };

  const handleSearchTermChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const handleClear = () => {
    setLocations([]);
  };

  const links = [
    { label: 'API', href: collectionLink, title: 'This dataset in the API' },
    {
      label: 'Source',
      href: sourceLink,
      title: 'Original source of pre-transformed data',
    },
    {
      label: 'Info',
      href: documentationLink,
      title: 'Background information from the original source data',
    },
  ].filter((link) => link.href?.length > 0);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);

  const getId = (feature: Feature) => {
    if (isStringIdentifierCollection) {
      return getIdStore(feature) ?? String(feature.id);
    }

    return String(feature.id);
  };

  const getFeatureLabel = (feature: Feature) => {
    if (layer.label) {
      const label = getLabel(feature, layer.label);
      if (label) {
        return `${label} (${getId(feature)})`;
      }
    }

    return getId(feature);
  };

  const selectedLocations = useMemo(() => {
    return [
      ...mapLocations.filter((feature) => locations.includes(getId(feature))),
      ...otherLocations.filter((feature) => locations.includes(getId(feature))),
    ];
  }, [locations, mapLocations, otherLocations]);

  return (
    <>
      <Accordion
        variant={Variant.Secondary}
        defaultValue={`links-${linkLocation?.layerId}-accordion`}
        items={[
          {
            id: `links-${layer.id}-accordion`,

            title: (
              <Group justify="space-between" className={styles.accordionHeader}>
                <Stack gap="calc(var(--default-spacing) / 2)">
                  <Text size="sm">{collection?.title}</Text>

                  <Title order={5} size="h3">
                    {layer.name}
                  </Title>
                </Stack>
                <Group gap="var(--default-spacing)" mr="calc(var(--default-spacing) * 2)">
                  {links.map(({ label, href, title }, index) => (
                    <Fragment key={`${collection?.id}-link-${label}`}>
                      {index > 0 && <Divider orientation="vertical" />}
                      <Anchor size="lg" target="_blank" href={href} title={title}>
                        {label}
                      </Anchor>
                    </Fragment>
                  ))}
                </Group>
              </Group>
            ),
            control: [CollectionType.EDR, CollectionType.Features].includes(collectionType) ? (
              <Download collectionId={layer.datasourceId} />
            ) : null,
            content: (
              <Box
                px="var(--default-spacing)"
                pb="var(--default-spacing)"
                className={styles.contentBorder}
              >
                {collection && (
                  <>
                    {hasParameters ? (
                      <Flex className={styles.layerContent} gap={0}>
                        <Menu
                          collectionId={layer.datasourceId}
                          collectionType={collectionType}
                          mapLocations={mapLocations
                            .filter((feature) => hasSearchTerm(searchTerm, feature))
                            .map((feature) => ({
                              id: getId(feature),
                              label: getFeatureLabel(feature),
                            }))}
                          otherLocations={otherLocations
                            .filter((feature) => hasSearchTerm(searchTerm, feature))
                            .map((feature) => ({
                              id: getId(feature),
                              label: getFeatureLabel(feature),
                            }))}
                          selectedLocations={locations}
                          addLocation={addLocation}
                          removeLocation={removeLocation}
                          searchTerm={searchTerm}
                          onSearchTermChange={handleSearchTermChange}
                          onClear={handleClear}
                          linkLocation={linkLocation}
                        />
                        <LayerBlock
                          layer={layer}
                          collection={collection}
                          collectionType={collectionType}
                          locations={selectedLocations}
                          linkLocation={linkLocation}
                        />
                      </Flex>
                    ) : (
                      <Group
                        justify="center"
                        align="center"
                        className={styles.parameterMessageWrapper}
                      >
                        <Text fw={700}>
                          Select at least one parameter for this data source to enable access to
                          download functionality.
                        </Text>
                      </Group>
                    )}
                  </>
                )}
              </Box>
            ),
          },
        ]}
      />
    </>
  );
};
