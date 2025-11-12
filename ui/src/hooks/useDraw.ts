/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import MapboxDraw, { DrawCreateEvent, DrawUpdateEvent } from '@mapbox/mapbox-gl-draw';
import { booleanIntersects, buffer, featureCollection, union } from '@turf/turf';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import debounce from 'lodash.debounce';
import { Map } from 'mapbox-gl';
import { v6 } from 'uuid';
import useMainStore from '@/stores/main';
import { DrawMode } from '@/stores/main/types';

export const useDraw = (map: Map | null, draw: MapboxDraw | null) => {
  const [loaded, setLoaded] = useState(false);

  const setDrawMode = useMainStore((store) => store.setDrawMode);

  const addDrawnShape = useMainStore((store) => store.addDrawnShape);

  const combineFeatures = (feature: Feature<Polygon | MultiPolygon>) => {
    if (!draw || !feature) {
      return;
    }

    const { features } = draw.getAll();
    const overlappingFeatures: Feature<Polygon | MultiPolygon>[] = [];

    const polygonFeatures = features.filter(
      (f): f is Feature<Polygon | MultiPolygon> =>
        f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'
    );

    // Hack to produce valid shapes
    const validFeature = buffer(feature, 0);

    if (validFeature) {
      polygonFeatures.forEach((existingFeature) => {
        if (existingFeature.id !== feature.id && booleanIntersects(existingFeature, feature)) {
          overlappingFeatures.push(existingFeature);
        }
      });

      const hasDrawnShape = useMainStore.getState().hasDrawnShape;
      const removeDrawnShape = useMainStore.getState().removeDrawnShape;

      if (overlappingFeatures.length > 0) {
        let combined = feature;

        overlappingFeatures.forEach((feature) => {
          const unionShape = union(featureCollection<Polygon | MultiPolygon>([combined, feature]));
          if (unionShape) {
            combined = unionShape;
          }
        });

        const idsToDelete = overlappingFeatures.map((f) => String(f.id));
        draw.delete(idsToDelete);
        idsToDelete.forEach((id) => {
          if (hasDrawnShape(id)) {
            removeDrawnShape(id);
          }
        });
        const newId = v6();
        combined.id = newId;
        if (!combined.properties) {
          combined.properties = {};
        }
        combined.properties.id = newId;

        const previousId = String(feature.id ?? feature.properties?.id);

        if (hasDrawnShape(previousId)) {
          removeDrawnShape(previousId);
        }

        draw.delete(previousId);
        draw.add(combined);

        addDrawnShape(combined);
      } else {
        const id = feature.id ?? feature.properties?.id;
        if (hasDrawnShape(id)) {
          removeDrawnShape(id);
        }
        addDrawnShape(feature);
      }
    }
  };

  const handleDrawUpdate = (e: DrawUpdateEvent) => {
    console.log('draw.update', e);
    const feature = e.features[0] as Feature<Polygon | MultiPolygon>;
    combineFeatures(feature);
  };

  const debouncedDrawUpdate = debounce(handleDrawUpdate, 250);

  useEffect(() => {
    return () => {
      debouncedDrawUpdate.cancel();
    };
  }, []);

  useEffect(() => {
    if (!map || !draw) {
      return;
    }

    // Map is loaded and draw is set
    setLoaded(true);

    map.on('draw.create', (e: DrawCreateEvent) => {
      const feature = e.features[0] as Feature<Polygon | MultiPolygon>;
      combineFeatures(feature);
    });

    map.on('draw.update', debouncedDrawUpdate);

    map.on('draw.modechange', (e) => {
      const { mode } = e;

      if (mode === 'draw_polygon') {
        setDrawMode(DrawMode.Polygon);
      } else {
        setDrawMode(null);
      }
    });
  }, [map, draw]);

  return { loaded };
};
