/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { StringIdentifierCollections } from '@/consts/collections';
import loadingManager from '@/managers/Loading.init';
import { ICollection } from '@/services/edr.service';
import { mainManager } from '@/services/init';
import useMainStore from '@/stores/main';
import { Layer, Location } from '@/stores/main/types';
import { LoadingType } from '@/stores/session/types';
import { getIdStore } from '@/utils/getIdStore';

export type LayerLocationGroup = {
  timeDataUpdated: number;
  selectedFeatures: Feature[];
  otherFeatures: Feature[];
};

export type LayerLocationGroups = Record<Layer['id'], LayerLocationGroup>;

export const useAllLocations = (layers: Layer[]) => {
  const locations = useMainStore((state) => state.locations);

  const [layerLocationGroups, setLayerLocationGroups] = useState<LayerLocationGroups>({});

  const controller = useRef<AbortController>(null);

  const getFilterFunction = (datasourceId: ICollection['id']) => {
    if (StringIdentifierCollections.includes(datasourceId)) {
      return (location: Location, feature: Feature) => location.id === getIdStore(feature);
    }

    return (location: Location, feature: Feature) => location.id === String(feature.id);
  };

  const buildGroup = (
    layer: Layer,
    features: Feature[],
    locations: Location[],
    existingGroup?: LayerLocationGroup
  ): LayerLocationGroup => {
    const locationsByLayer = locations.filter((l) => l.layerId === layer.id);
    const filter = getFilterFunction(layer.datasourceId);

    const selected: Feature[] = [];
    const other: Feature[] = [];

    for (const feature of features) {
      if (locationsByLayer.some((loc) => filter(loc, feature))) {
        selected.push(feature);
      } else {
        other.push(feature);
      }
    }

    return {
      selectedFeatures: selected,
      otherFeatures: other,
      timeDataUpdated: existingGroup?.timeDataUpdated ?? Date.now(),
    };
  };

  const moveLocations = (layers: Layer[], locations: Location[]) => {
    setLayerLocationGroups((prev) => {
      const next: LayerLocationGroups = {};

      for (const layer of layers) {
        const existing = prev[layer.id];
        if (!existing) {
          continue;
        }

        const allFeatures = [...existing.selectedFeatures, ...existing.otherFeatures];

        next[layer.id] = buildGroup(layer, allFeatures, locations, existing);
      }

      return { ...prev, ...next };
    });
  };

  // Get all non-selected locations, rendered or not on map
  const getAllLocations = async (
    layers: Layer[],
    locations: Location[]
  ): Promise<LayerLocationGroups> => {
    controller.current = new AbortController();

    const results = await Promise.all(
      layers
        .filter((layer) => layer.loaded)
        .map(async (layer) => {
          const existing = layerLocationGroups[layer.id];

          if (existing && existing.timeDataUpdated === layer.timeDataUpdated) {
            return [layer.id, existing] as const;
          }

          const res = await mainManager.getFeatures(layer, controller.current!.signal);

          const group = buildGroup(layer, res.features, locations, existing);

          return [layer.id, group] as const;
        })
    );

    return Object.fromEntries(results);
  };

  useEffect(() => {
    let isMounted = true;
    const loadingInstance = loadingManager.add(`Fetching locations`, LoadingType.Locations);
    getAllLocations(layers, locations)
      .then((groups) => {
        if (isMounted) {
          setLayerLocationGroups(groups);
        }
      })
      .catch((error: string | Error) => {
        if ((error as Error)?.name !== 'AbortError') {
          console.error(error);
        }
      })
      .finally(() => {
        loadingManager.remove(loadingInstance);
      });

    return () => {
      isMounted = false;
    };
  }, [layers]);

  useEffect(() => {
    moveLocations(layers, locations);
  }, [locations]);

  useEffect(() => {
    return () => {
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  return { layerLocationGroups };
};
