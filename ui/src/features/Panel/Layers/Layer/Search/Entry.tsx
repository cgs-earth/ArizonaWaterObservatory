/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GeoJsonProperties } from 'geojson';
import { Stack, Text, TextInput } from '@mantine/core';
import { StringIdentifierCollections } from '@/consts/collections';
import { Matches } from '@/features/Panel/Layers/Layer/Search/Matches';
import { Properties } from '@/features/Panel/Layers/Layer/Search/Properties';
import styles from '@/features/Panel/Layers/Layer/Search/Search.module.css';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import { useLocations } from '@/hooks/useLocations';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import { hasSearchTerm } from '@/utils/searchFeatures';
import { sortObject } from '@/utils/sortObject';

type Props = {
  layer: Layer;
};

export const Entry: React.FC<Props> = (props) => {
  const { layer } = props;

  const [title, setTitle] = useState('');
  const [sampleProperties, setSampleProperties] = useState<GeoJsonProperties>(null);

  const { selectedLocations, otherLocations } = useLocations(layer);

  const search = useMainStore((state) => state.searches).find(
    (search) => search.layerId === layer.id
  ) ?? {
    layerId: layer.id,
    searchTerm: '',
    matchedLocations: [],
  };
  const addSearchTerm = useMainStore((state) => state.addSearch);
  const removeSearchTerm = useMainStore((state) => state.removeSearch);

  useEffect(() => {
    const datasource = mainManager.getDatasource(layer.datasourceId);

    if (datasource && datasource?.title) {
      setTitle(datasource.title);
    }
  }, [layer]);

  useEffect(() => {
    const location =
      selectedLocations.length > 0
        ? selectedLocations[0]
        : otherLocations.length > 0
          ? otherLocations[0]
          : null;

    if (location) {
      setSampleProperties(sortObject(location.properties));
    }
  }, [selectedLocations, otherLocations]);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);

  const handleChange = (searchTerm: string) => {
    if (searchTerm.length === 0) {
      removeSearchTerm(layer.id);
      return;
    }

    const matchedLocations = [...selectedLocations, ...otherLocations]
      .filter((feature) => hasSearchTerm(searchTerm, feature))
      .map((feature) => getId(feature, isStringIdentifierCollection));

    addSearchTerm(layer.id, searchTerm, matchedLocations);
  };

  const showMatches = search.matchedLocations.length > 0;
  const showProperties = !showMatches && sampleProperties && search.searchTerm.length === 0;

  return (
    <Stack className={styles.entry} gap="calc(var(--default-spacing) / 2)">
      <TextInput
        size="xs"
        label={
          <Text size="xs" fw={700} title={title}>
            {title}
          </Text>
        }
        value={search.searchTerm}
        onChange={(event) => handleChange(event.currentTarget.value)}
        placeholder="Search all features in data source"
      />
      {showMatches && (
        <Matches
          layer={layer}
          searchTerm={search.searchTerm}
          matchedLocations={search.matchedLocations}
          selectedLocations={selectedLocations}
          otherLocations={otherLocations}
          isStringIdentifierCollection={isStringIdentifierCollection}
          lineLimit={5}
          locationLimit={10}
        />
      )}
      {showProperties && <Properties properties={sampleProperties} />}
      {!showMatches && !showProperties && (
        <Text size="sm" ta="center" mt="calc(var(--default-spacing) * 1)">
          No locations found.
        </Text>
      )}
    </Stack>
  );
};
