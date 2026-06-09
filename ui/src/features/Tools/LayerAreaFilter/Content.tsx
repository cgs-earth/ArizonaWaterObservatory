/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { Stack,Text } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { useLocations } from '@/hooks/useLocations';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};

export const LocationsCheckList: React.FC<Props> = (props) => {
  const { layer } = props; 
  const { selectedLocations, otherLocations, setSelectedLocations, setOtherLocations } =
    useLocations(layer);

  const handleDontShowClick = (
    event: React.ChangeEvent<HTMLInputElement>,
    location: Feature<Geometry, GeoJsonProperties>
  ) => {
    const { checked } = event.currentTarget;
    console.log("location:",location);
    if (checked && !selectedLocations.includes(location)) {
      selectedLocations.push(location);
      console.log("Filtered OtherLOcations:",otherLocations.filter((filterLocation) => !(filterLocation.id === location.id)));
      setOtherLocations(
        otherLocations.filter((filterLocation) => !(filterLocation.id === location.id))
      );
    } 
    if(!checked && !otherLocations.includes(location)) {
      console.log("filtered SleectedLocations:", selectedLocations.filter((filterLocation) => filterLocation.id === location.id));
      otherLocations.push(location);
      setSelectedLocations(
        selectedLocations.filter((filterLocation) => !(filterLocation.id === location.id))
      );
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
