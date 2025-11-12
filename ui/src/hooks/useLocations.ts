/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';

export const useLocations = (layer: Layer) => {
  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState<Feature[]>([]);
  const [otherLocations, setOtherLocations] = useState<Feature[]>([]);

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
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  return { selectedLocations, otherLocations };
};
