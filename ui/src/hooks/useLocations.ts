/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { StringIdentifierCollections } from '@/consts/collections';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer, Location } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';
import { getIdStore } from '@/utils/getIdStore';

export const useLocations = (layer: Layer) => {
  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState<Feature[]>([]);
  const [otherLocations, setOtherLocations] = useState<Feature[]>([]);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const getFilterFunction = (datasourceId: ICollection['id']) => {
    if (StringIdentifierCollections.includes(datasourceId)) {
      return (location: Location, feature: Feature) => location.id === getIdStore(feature);
    }

    return (location: Location, feature: Feature) => location.id === feature.id;
  };

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

      const filterFunction = getFilterFunction(layer.datasourceId);

      const selectedLocations = allLocations.features.filter((feature) =>
        layerLocations.some((location) => filterFunction(location, feature))
      );

      const otherLocations = allLocations.features.filter(
        (feature) => !layerLocations.some((location) => filterFunction(location, feature))
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

// USGS
// Discharge in cubic feet/s

// ADWR Groundwater
// Depth to Water
