/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Popup } from '.';
import { center } from '@turf/turf';
import { Feature } from 'geojson';
import { Map, MapMouseEvent, Popup as PopupType } from 'mapbox-gl';
import { Root } from 'react-dom/client';
import { Mantine as MantineProvider } from '@/providers/Mantine';
import { Location } from '@/stores/main/types';

export const showGraphPopup = (
  location: Location,
  map: Map,
  e: MapMouseEvent,
  root: Root,
  container: HTMLDivElement,
  persistentPopup: PopupType,
  checkIdentifier = false
) => {
  if (e.features && e.features.length > 0) {
    const feature = e.features[0] as Feature;

    if (feature.properties) {
      const identifier = String(location.id);
      const currentIdentifier = container.getAttribute('data-identifier');
      // Dont recreate the same popup for the same feature
      if (!checkIdentifier || identifier !== currentIdentifier) {
        container.setAttribute('data-identifier', identifier);

        const close = () => {
          persistentPopup.remove();
        };

        root.render(
          <MantineProvider>
            <Popup close={close} location={location} feature={feature} />
          </MantineProvider>
        );

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
  }
};
