/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { bboxPolygon, featureCollection } from '@turf/turf';
import { BBox, Feature, MultiPolygon, Polygon } from 'geojson';
import { FilterSpecification, GeoJSONSource, LngLatBoundsLike, Map } from 'mapbox-gl';
import { getBBox } from '@/data/bbox';
import { LayerId } from '@/features/Map/config';
import { SourceId } from '@/features/Map/sources';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import geoconnexService from '@/services/init/geoconnex.init';
import useMainStore from '@/stores/main';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { PredefinedBoundary } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';

const LOWER_COLORADO_ID = '15';
export const LOWER_COLORADO_ID_NUMERIC = Number(LOWER_COLORADO_ID);
const UPPER_COLORADO_ID = '14';
export const UPPER_COLORADO_ID_NUMERIC = Number(UPPER_COLORADO_ID);
export const COLORADO_RIVER_BASIN_ID_NUMERIC = 1;
const ARIZONA_ID = '04';
export const ARIZONA_ID_NUMERIC = Number(ARIZONA_ID);

export const useSpatialSelection = (map: Map | null) => {
  const spatialSelection = useMainStore((state) => state.spatialSelection);
  const layerCount = useMainStore((state) => state.layers.length);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);
  const loadingInstance = useRef<string>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  const fetchLowerColoradoBasin = () => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('hu02', LOWER_COLORADO_ID, {
      signal: controller.current?.signal,
    });
  };

  const fetchUpperColoradoBasin = () => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('hu02', UPPER_COLORADO_ID, {
      signal: controller.current?.signal,
    });
  };

  const fetchArizona = () => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('states', ARIZONA_ID, {
      signal: controller.current?.signal,
    });
  };

  const getDetailedFilter = (boundary: PredefinedBoundary): FilterSpecification => {
    switch (boundary) {
      case PredefinedBoundary.ColoradoRiverBasin:
        return [
          'any',
          ['==', ['id'], LOWER_COLORADO_ID_NUMERIC],
          ['==', ['id'], UPPER_COLORADO_ID_NUMERIC],
        ];

      case PredefinedBoundary.Arizona:
      default:
        return ['==', ['id'], ARIZONA_ID_NUMERIC];
    }
  };

  const getBBoxFilter = (boundary: PredefinedBoundary): FilterSpecification => {
    switch (boundary) {
      case PredefinedBoundary.ColoradoRiverBasin:
        return ['==', ['id'], COLORADO_RIVER_BASIN_ID_NUMERIC];

      case PredefinedBoundary.Arizona:
      default:
        return ['==', ['id'], ARIZONA_ID_NUMERIC];
    }
  };

  const loadPredefinedBoundaries = async (map: Map) => {
    const bboxes: { id: number; bbox: BBox }[] = [
      { id: ARIZONA_ID_NUMERIC, bbox: getBBox(PredefinedBoundary.Arizona) },
      { id: COLORADO_RIVER_BASIN_ID_NUMERIC, bbox: getBBox(PredefinedBoundary.ColoradoRiverBasin) },
    ];
    const [azResult, lcResult, ucResult] = await Promise.allSettled([
      fetchArizona(),
      fetchLowerColoradoBasin(),
      fetchUpperColoradoBasin(),
    ]);

    const has: PredefinedBoundary[] = [];

    const features: Feature<Polygon | MultiPolygon>[] = [];
    if (azResult.status === 'fulfilled') {
      features.push(azResult.value);
      has.push(PredefinedBoundary.Arizona);
    }
    if (lcResult.status === 'fulfilled' && ucResult.status === 'fulfilled') {
      features.push(lcResult.value, ucResult.value);
      has.push(PredefinedBoundary.ColoradoRiverBasin);
    }

    const spatialSelectionSource = map.getSource<GeoJSONSource>(SourceId.SpatialSelection);
    const spatialSelectionBBoxSource = map.getSource<GeoJSONSource>(SourceId.SpatialSelectionBBox);

    const detailedFeatureCollection = featureCollection(features);

    const bboxFeatureCollection = featureCollection(
      bboxes.map(({ id, bbox }) => bboxPolygon(bbox, { id }))
    );

    if (spatialSelectionSource) {
      spatialSelectionSource.setData(detailedFeatureCollection);
    }

    if (spatialSelectionBBoxSource) {
      spatialSelectionBBoxSource.setData(bboxFeatureCollection);
    }
  };

  const switchPredefinedBoundaries = async (boundary: PredefinedBoundary, strict: boolean) => {
    // There is no data that needs to refetch
    if (layerCount === 0) {
      return;
    }

    const getTitle = () => {
      if (boundary === PredefinedBoundary.ColoradoRiverBasin) {
        return 'Colorado River Basin';
      }

      return 'Arizona';
    };

    const message = `Updating data boundaries to: ${getTitle()}${strict ? ', in strict mode.' : '.'}`;

    loadingInstance.current = loadingManager.add(message, LoadingType.Geography);
    try {
      await mainManager.applySpatialFilter([]);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      } else if (typeof error === 'string') {
        notificationManager.show(`Error: ${error}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingInstance.current = loadingManager.remove(loadingInstance.current);
      notificationManager.show(
        `Data boundaries updated to: ${getTitle()}`,
        NotificationType.Success
      );
    }
  };

  useEffect(() => {
    if (!map) {
      return;
    }

    void loadPredefinedBoundaries(map);
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (!spatialSelection) {
      // TODO: what needs to occur if all spatial selections cleared
      return;
    }

    const { strict } = spatialSelection;
    if (isSpatialSelectionPredefined(spatialSelection)) {
      const { boundary } = spatialSelection;

      const detailedFilter = getDetailedFilter(boundary);

      if (map.getLayer(LayerId.SpatialSelection)) {
        map.setFilter(LayerId.SpatialSelection, detailedFilter);
      }

      const bboxFilter = getBBoxFilter(boundary);

      if (map.getLayer(LayerId.SpatialSelectionBBox)) {
        map.setFilter(LayerId.SpatialSelectionBBox, bboxFilter);
      }

      const bbox = getBBox(boundary) as LngLatBoundsLike;

      map.fitBounds(bbox, { padding: 40 });

      void switchPredefinedBoundaries(boundary, strict);
    }

    const visibility = strict ? 'none' : 'visible';

    if (map.getLayer(LayerId.SpatialSelectionBBox)) {
      map.setLayoutProperty(LayerId.SpatialSelectionBBox, 'visibility', visibility);
    }
  }, [map, spatialSelection]);
};
