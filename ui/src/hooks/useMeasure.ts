/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { featureCollection, length, lineString } from '@turf/turf';
import { Feature, Point } from 'geojson';
import { GeoJSONFeature, GeoJSONSource, Map, MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import { v6 } from 'uuid';
import { SubLayerId } from '@/features/Map/config';
import { SourceId } from '@/features/Map/sources';
import useSessionStore from '@/stores/session';
import { DrawMode } from '@/stores/session/types';
import { getUniqueFeatures } from '@/utils/uniqueFeatures';

export const useMeasure = (map: Map | null, draw: MapboxDraw | null) => {
  const drawMode = useSessionStore((store) => store.drawMode);

  useEffect(() => {
    if (!map || !draw) {
      return;
    }

    let feature: Feature<Point> | undefined;

    const createLine = (pointA: Feature<Point>, pointB: Feature<Point>) => {
      const line = lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);

      const source = map.getSource(SourceId.MeasureLine) as GeoJSONSource;
      const distance = length(line, { units: 'miles' }).toFixed(2);

      const measuredLine = {
        ...line,
        properties: {
          ...line.properties,
          distance: `${distance}mi`,
        },
      };

      source.setData(measuredLine);
    };

    const onMove = (e: MapMouseEvent | MapTouchEvent) => {
      const source = map.getSource(SourceId.MeasurePoints) as GeoJSONSource;

      if (!source) {
        return;
      }

      if (feature) {
        const coords = e.lngLat;

        map.getCanvas().style.cursor = 'grabbing';

        const points = getUniqueFeatures(
          map.querySourceFeatures(SourceId.MeasurePoints, {
            sourceLayer: SourceId.MeasurePoints,
          }),
          'id'
        ).filter((point) => point.properties?.id !== feature!.properties?.id);

        feature.geometry.coordinates = [coords.lng, coords.lat];

        points.push(feature as GeoJSONFeature);
        source.setData(featureCollection(points));
        const pointA = points[0] as Feature<Point>;
        const pointB = points[1] as Feature<Point>;
        createLine(pointA, pointB);
      }
    };

    const onUp = () => {
      map.getCanvas().style.cursor = '';

      map.off('mousemove', onMove);
      map.off('touchmove', onMove);
    };

    const onClick = (e: MapMouseEvent) => {
      const drawMode = useSessionStore.getState().drawMode;

      if (drawMode === DrawMode.Measure) {
        const currentPoints = map.queryRenderedFeatures(e.point, {
          layers: [SubLayerId.MeasurePoints],
        });

        if (currentPoints.length > 0) {
          return;
        }

        const point = {
          type: 'Feature',

          geometry: {
            type: 'Point',
            coordinates: [e.lngLat.lng, e.lngLat.lat],
          },
          properties: {
            timeCreated: Date.now(),
            id: v6(),
          },
        } as unknown as GeoJSONFeature;

        const points = getUniqueFeatures(
          map.querySourceFeatures(SourceId.MeasurePoints, {
            sourceLayer: SourceId.MeasurePoints,
          }),
          'id'
        );

        const source = map.getSource(SourceId.MeasurePoints) as GeoJSONSource;

        if (point) {
          if (points.length === 0) {
            points.push(point);
            source.setData(featureCollection(points));
          } else if (points.length === 1) {
            points.push(point);
            source.setData(featureCollection(points));
            const pointA = points[0] as Feature<Point>;
            const pointB = points[1] as Feature<Point>;
            createLine(pointA, pointB);
          } else {
            const oldestPoint = points.reduce((pointA, pointB) =>
              pointA.properties?.timeCreated < pointB.properties?.timeCreated ? pointA : pointB
            );

            const newPoints = points.filter(
              (point) => point.properties?.id !== oldestPoint.properties?.id
            );

            newPoints.push(point);

            source.setData(featureCollection(newPoints));
            const pointA = newPoints[0] as Feature<Point>;
            const pointB = newPoints[1] as Feature<Point>;
            createLine(pointA, pointB);
          }
        }
      }
    };

    const onMouseDown = (e: MapMouseEvent) => {
      e.preventDefault();
      feature = e.features?.[0] as Feature<Point> | undefined;
      if (feature) {
        map.getCanvas().style.cursor = 'grab';
        map.on('mousemove', onMove);
        map.once('mouseup', onUp);
      }
    };

    const onTouchStart = (e: MapTouchEvent) => {
      if (e.points.length !== 1) {
        return;
      }
      e.preventDefault();
      const point = e.features?.[0] as Feature<Point> | undefined;
      if (point) {
        map.on('touchmove', onMove);
        map.once('touchend', onUp);
      }
    };

    if (drawMode === DrawMode.Measure) {
      map.on('click', onClick);
      map.on('mousedown', SubLayerId.MeasurePoints, onMouseDown);
      map.on('touchstart', SubLayerId.MeasurePoints, onTouchStart);
    } else {
      map.off('click', onClick);
      map.off('mousedown', SubLayerId.MeasurePoints, onMouseDown);
      map.off('touchstart', SubLayerId.MeasurePoints, onTouchStart);
    }

    return () => {
      map.off('click', onClick);
      map.off('mousedown', SubLayerId.MeasurePoints, onMouseDown);
      map.off('touchstart', SubLayerId.MeasurePoints, onTouchStart);
    };
  }, [drawMode]);
};
