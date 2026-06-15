/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { StringIdentifierCollections } from '@/consts/collections';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import { Menu } from '@/features/TopBar/Links/Menu';
import { useLocations } from '@/hooks/useLocations';
import { collectionService } from '@/services/init';
import useMainStore from '@/stores/main';
import { Layer as LayerType, Location } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getLabel } from '@/utils/getLabel';
import { hasSearchTerm } from '@/utils/searchFeatures';

type Props = {
  layer: LayerType;
  locations: Location[];
  onLocationAdd: (location: Location) => void;
  onLocationRemove: (location: Location) => void;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer, locations, onLocationAdd, onLocationRemove } = props;

  const searches = useMainStore((state) => state.searches);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

  const { selectedLocations: mapLocations, otherLocations } = useLocations(layer);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);

  useEffect(() => {
    const search = searches.find((search) => search.layerId === layer.id);

    if (search) {
      setSearchTerm(search.searchTerm);
    }
  }, [searches]);

  useEffect(() => {
    const collection = collectionService.getDatasource(layer.datasourceId);

    if (collection) {
      const collectionType = getCollectionType(collection);

      setCollectionType(collectionType);
    }
  }, [layer.datasourceId]);

  const handleSearchTermChange = (searchTerm: string) => {
    setSearchTerm(searchTerm);
  };

  const getFeatureLabel = (feature: Feature) => {
    if (layer.label) {
      const label = getLabel(feature, layer.label);
      if (label) {
        return `${label} (${getId(feature, isStringIdentifierCollection)})`;
      }
    }

    return getId(feature, isStringIdentifierCollection);
  };

  const handleLocationAdd = (id: string) => {
    onLocationAdd({ id, layerId: layer.id });
  };

  const handleLocationRemove = (id: string) => {
    onLocationRemove({ id, layerId: layer.id });
  };

  return (
    <Menu
      collectionId={layer.datasourceId}
      collectionType={collectionType}
      mapLocations={mapLocations
        .filter((feature) => hasSearchTerm(searchTerm, feature))
        .map((feature) => ({
          id: getId(feature, isStringIdentifierCollection),
          label: getFeatureLabel(feature),
        }))}
      otherLocations={otherLocations
        .filter((feature) => hasSearchTerm(searchTerm, feature))
        .map((feature) => ({
          id: getId(feature, isStringIdentifierCollection),
          label: getFeatureLabel(feature),
        }))}
      selectedLocations={locations.map((location) => location.id)}
      addLocation={handleLocationAdd}
      removeLocation={handleLocationRemove}
      searchTerm={searchTerm}
      onSearchTermChange={handleSearchTermChange}
      linkLocation={null}
    />
  );
};
