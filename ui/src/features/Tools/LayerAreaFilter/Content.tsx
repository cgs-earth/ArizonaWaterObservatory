/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { Stack, Text } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import { StringIdentifierCollections } from '@/consts/collections';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import { useLocations } from '@/hooks/useLocations';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};

export const LocationsCheckList: React.FC<Props> = (props) => {
  const { layer } = props;
  const { selectedLocations, otherLocations } = useLocations(layer);
  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);
  const addLocation = useMainStore((state) => state.addLocation);
  const removeLocation = useMainStore((state) => state.removeLocation);
  const handleDontShowClick = (
    event: React.ChangeEvent<HTMLInputElement>,
    location: Feature<Geometry, GeoJsonProperties>
  ) => {
    const { checked } = event.currentTarget;

    const id = getId(location, isStringIdentifierCollection);

    if (checked) {
      addLocation({
        id,
        layerId: layer.id,
      });
    } else {
      removeLocation({
        id,
        layerId: layer.id,
      });
    }
  };

  // specify as li
  return (
    <>
      <Stack>
        <Text>Selected</Text>
        {selectedLocations.length > 0 ? (
          [...selectedLocations].map((location) => (
            <Checkbox
              key={`layer-area-selected-${layer.id}-${location.id}`}
              size="sm"
              checked
              onChange={(event) => handleDontShowClick(event, location)}
              label={location.id}
            />
          ))
        ) : (
          <Fallback />
        )}
        <Text>Other Locations</Text>
        {otherLocations.length > 0 ? (
          [...otherLocations].map((location) => (
            <Checkbox
              key={`layer-area-other-${layer.id}-${location.id}`}
              size="sm"
              onChange={(event) => handleDontShowClick(event, location)}
              label={location.id}
            />
          ))
        ) : (
          <Fallback />
        )}
      </Stack>
    </>
  );
};
