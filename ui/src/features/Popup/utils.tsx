/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { center } from '@turf/turf';
import { Feature } from 'geojson';
import { Map, MapMouseEvent, Popup as PopupType } from 'mapbox-gl';
import { Root } from 'react-dom/client';
import Popup from '@/features/Popup';
import { Mantine as MantineProvider } from '@/providers/Mantine';
import { Layer, Location } from '@/stores/main/types';
import { LAYER_IDENTIFIER, LOCATION_IDENTIFIER } from '../Map/consts';

export const showGraphPopup = (
  layerId: Layer['id'],
  locations: Location[],
  map: Map,
  e: MapMouseEvent,
  root: Root,
  container: HTMLDivElement,
  persistentPopup: PopupType,
  checkIdentifier = false
) => {
  if (e.features && e.features.length > 0 && locations.length > 0) {
    const features = e.features as Feature[];

    const identifier = String(locations[0].id);
    const currentIdentifier = container.getAttribute(LOCATION_IDENTIFIER);
    // Dont recreate the same popup for the same feature
    if (!checkIdentifier || identifier !== currentIdentifier) {
      container.setAttribute(LOCATION_IDENTIFIER, identifier);
      container.setAttribute(LAYER_IDENTIFIER, layerId);

      const close = () => {
        persistentPopup.remove();
      };

      root.render(
        <MantineProvider>
          <Popup close={close} locations={locations} features={features} layerId={layerId} />
        </MantineProvider>
      );

      const feature = features[0];

      const centerPoint = (
        feature.geometry.type === 'Point'
          ? feature.geometry.coordinates
          : center(feature).geometry.coordinates
      ) as [number, number];
      persistentPopup
        .setLngLat(centerPoint)
        .setDOMContent(container)
        .setMaxWidth('fit-content')
        .addTo(map);
    }
  }
};
