/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { StringIdentifierCollections } from '@/consts/collections';
import loadingManager from '@/managers/Loading.init';
import { ICollection } from '@/services/edr.service';
import { mainManager } from '@/services/init';
import useMainStore from '@/stores/main';
import { Layer, Location } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';
import { getIdStore } from '@/utils/getIdStore';

export const useLocations = (layer?: Layer | Layer[]) => {
  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState<Feature[]>([]);
  const [otherLocations, setOtherLocations] = useState<Feature[]>([]);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const getFilterFunction = (datasourceId: ICollection['id']) => {
    if (StringIdentifierCollections.includes(datasourceId)) {
      return (location: Location, feature: Feature) => location.id === getIdStore(feature);
    }

    return (location: Location, feature: Feature) => location.id === String(feature.id);
  };

  // Get all non-selected locations, rendered or not on map
  const getOtherLocations = async (layer: Layer) => {
    if (!layer) {
      return { selectedLocations, otherLocations };
    }
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

  const getAllOtherLocations = async (layers: Layer[]) => {
    if (layers.length === 0) {
      return { selectedLocations, otherLocations };
    }
    const loadingInstance = loadingManager.add(`Fetching locations`, LoadingType.Locations);
    try {
      controller.current = new AbortController();
      const selectedLocations: Feature<Geometry, GeoJsonProperties>[] = [];
      const otherLocations: Feature<Geometry, GeoJsonProperties>[] = [];
      for (const layer of layers) {
        const allLocations = await mainManager.getFeatures(layer, controller.current.signal);
        const layerLocations = locations.filter((location) => location.layerId === layer.id);
        const filterFunction = getFilterFunction(layer.datasourceId);

        const tempSelectedLocations = allLocations.features.filter((feature) =>
          layerLocations.some((location) => filterFunction(location, feature))
        );

        const tempOtherLocations = allLocations.features.filter(
          (feature) => !layerLocations.some((location) => filterFunction(location, feature))
        );

        selectedLocations.push(...tempSelectedLocations);
        otherLocations.push(...tempOtherLocations);
      }

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
    if (Array.isArray(layer)) {
      void getAllOtherLocations(layer);
    }
    if (!layer) {
      return;
    }
    if (!Array.isArray(layer)) {
      void getOtherLocations(layer);
    }
  }, [locations]);

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
