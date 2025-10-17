/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Feature } from 'geojson';
import { Stack, Title } from '@mantine/core';
import { ICollection } from '@/services/edr.service';
import { Layer, Location as LocationType } from '@/stores/main/types';
import { Location } from './Location';

type Props = {
  locations: LocationType[] | Feature[];
  collection: ICollection;
  layer: Layer;
  provider: string;
};

export const LocationBlock: React.FC<Props> = (props) => {
  const { locations, collection, layer, provider } = props;

  const [pageSize, setPageSize] = useState(10);

  return (
    <Stack component="section" mt="sm">
      {collection &&
        locations.map((location) => (
          <Location
            key={`selected-location-${layer.id}-${location.id}`}
            location={location}
            layer={layer}
            collection={collection}
            provider={provider}
          />
        ))}
    </Stack>
  );
};
