/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { bboxPolygon, featureCollection } from '@turf/turf';
import { BBox, Feature, MultiPolygon, Polygon } from 'geojson';
import { FilterSpecification, GeoJSONSource, Map } from 'mapbox-gl';
import { getBBox } from '@/consts/bbox';
import { LayerId } from '@/features/Map/config';
import { SourceId } from '@/features/Map/sources';
import { getGeocoderFilterFunction } from '@/features/Map/utils';
import loadingManager from '@/managers/Loading.init';
import notificationManager from '@/managers/Notification.init';
import { mainManager } from '@/services/init';
import geoconnexService from '@/services/init/geoconnex.init';
import useMainStore from '@/stores/main';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { PredefinedBoundary } from '@/stores/main/types';
import { LoadingType, NotificationVariant } from '@/stores/session/types';

export const LOWER_COLORADO_ID = '15';
export const LOWER_COLORADO_ID_NUMERIC = Number(LOWER_COLORADO_ID);
export const UPPER_COLORADO_ID = '14';
export const UPPER_COLORADO_ID_NUMERIC = Number(UPPER_COLORADO_ID);
export const COLORADO_RIVER_BASIN_ID_NUMERIC = 1;
export const ARIZONA_ID = '04';
export const ARIZONA_ID_NUMERIC = Number(ARIZONA_ID);

/**
 * This hook loads specific features from the reference service, before storing them all into a single GeoJSON source.
 * It listens for any changes to spatialSelection in the main store and handles any data fetches/filtering as required.
 *
 * @param map Map | null
 * @returns void
 */
export const useSpatialSelection = (map: Map | null, geocoder: MapboxGeocoder | null) => {
  const spatialSelection = useMainStore((state) => state.spatialSelection);
  const layerCount = useMainStore((state) => state.layers.length);
  const drawnShapes = useMainStore((state) => state.drawnShapes);

  const fetchLowerColoradoBasin = (signal: AbortSignal) => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('hu02', LOWER_COLORADO_ID, {
      signal,
    });
  };

  const fetchUpperColoradoBasin = (signal: AbortSignal) => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('hu02', UPPER_COLORADO_ID, {
      signal,
    });
  };

  const fetchArizona = (signal: AbortSignal) => {
    return geoconnexService.getItem<Feature<Polygon | MultiPolygon>>('states', ARIZONA_ID, {
      signal,
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

  useEffect(() => {
    if (!map) {
      return;
    }

    const bboxes: { id: number; bbox: BBox }[] = [
      { id: ARIZONA_ID_NUMERIC, bbox: getBBox(PredefinedBoundary.Arizona) },
      {
        id: COLORADO_RIVER_BASIN_ID_NUMERIC,
        bbox: getBBox(PredefinedBoundary.ColoradoRiverBasin),
      },
    ];

    const loadingInstance = loadingManager.add(
      'Loading Predefined Boundary data',
      LoadingType.Geography
    );
    const controller = new AbortController();

    Promise.allSettled([
      fetchArizona(controller.signal),
      fetchLowerColoradoBasin(controller.signal),
      fetchUpperColoradoBasin(controller.signal),
    ])
      .then(([azResult, lcResult, ucResult]) => {
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

        const spatialSelectionBBoxSource = map.getSource<GeoJSONSource>(
          SourceId.SpatialSelectionBBox
        );

        const detailedFeatureCollection = featureCollection(features);

        const bboxFeatureCollection = featureCollection(
          bboxes.map(({ id, bbox }) => bboxPolygon(bbox, { id }))
        );

        spatialSelectionSource?.setData(detailedFeatureCollection);
        spatialSelectionBBoxSource?.setData(bboxFeatureCollection);
      })
      .finally(() => {
        loadingManager.remove(loadingInstance);
      });

    return () => {
      controller.abort('Component unmount');
    };
  }, [map]);
  useEffect(() => {
    if (!map) {
      return;
    }

    if (!spatialSelection) {
      // TODO: what needs to occur if all spatial selections cleared
      return;
    }

    const controller = new AbortController();

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

      const bbox = getBBox(boundary);

      if (geocoder) {
        geocoder.setBbox(bbox);
        const filterFunction = getGeocoderFilterFunction(boundary, strict);
        geocoder.setFilter(filterFunction);
      }

      // Special case: actively loading a share config object
      // let configService.loadConfig apply the spatial filter
      if (loadingManager.has({ type: LoadingType.Share })) {
        return;
      }

      map.fitBounds(bbox, { padding: 40 });

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

      const loadingInstance = loadingManager.add(message, LoadingType.Geography);

      // Reapply spatial filters for all layers to include new bounds
      mainManager
        .applySpatialFilter(drawnShapes, { signal: controller.signal })
        .catch((error) => {
          if ((error as Error)?.message) {
            const _error = error as Error;
            notificationManager.show(`${_error.message}`, NotificationVariant.Error, 10000);
          } else if (typeof error === 'string') {
            notificationManager.show(`${error}`, NotificationVariant.Error, 10000);
          }
        })
        .finally(() => {
          loadingManager.remove(loadingInstance);
          notificationManager.show(
            `Data boundaries updated to: ${getTitle()}`,
            NotificationVariant.Success
          );
        });
    }

    // Toggle visibility of bounding box
    const visibility = strict ? 'none' : 'visible';

    if (map.getLayer(LayerId.SpatialSelectionBBox)) {
      map.setLayoutProperty(LayerId.SpatialSelectionBBox, 'visibility', visibility);
    }

    return () => {
      controller.abort('Component unmount');
    };
  }, [map, spatialSelection]);
};
