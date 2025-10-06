/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { featureCollection, length, lineString } from '@turf/turf';
import { Feature, Point } from 'geojson';
import { GeoJSONSource, Map, MapMouseEvent, MapTouchEvent } from 'mapbox-gl';
import { v6 } from 'uuid';
import { SubLayerId } from '@/features/Map/config';
import { SourceId } from '@/features/Map/sources';
import useSessionStore from '@/stores/session';
import { DrawMode } from '@/stores/session/types';

export const useMeasure = (map: Map | null, draw: MapboxDraw | null) => {
  const drawMode = useSessionStore((store) => store.drawMode);
  const setPoints = useSessionStore((store) => store.setPoints);

  useEffect(() => {
    if (!map || !draw) {
      return;
    }

    let feature: Feature<Point> | null = null;

    const updatePointsSource = (features: Feature<Point>[]) => {
      const collection = featureCollection(features);
      const source = map.getSource(SourceId.MeasurePoints) as GeoJSONSource;
      source?.setData(collection);
      setPoints(collection);
    };

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

        const points = useSessionStore.getState().points;

        feature.geometry.coordinates = [coords.lng, coords.lat];

        const updatedPoints = points.features.map((pt) =>
          pt.properties?.id === feature?.properties?.id
            ? { ...feature, geometry: { type: 'Point', coordinates: [coords.lng, coords.lat] } }
            : pt
        ) as Feature<Point>[];
        updatePointsSource(updatedPoints);

        const pointA = updatedPoints[0] as Feature<Point>;
        const pointB = updatedPoints[1] as Feature<Point>;
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
      if (drawMode !== DrawMode.Measure) {
        return;
      }

      const clickedFeatures = map.queryRenderedFeatures(e.point, {
        layers: [SubLayerId.MeasurePoints],
      });

      if (clickedFeatures.length > 0) {
        return;
      }

      const newPoint: Feature<Point> = {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [e.lngLat.lng, e.lngLat.lat] },
        properties: { timeCreated: Date.now(), id: v6() },
      };

      const currentPoints = useSessionStore.getState().points.features;
      let updatedFeatures: Feature<Point>[];

      if (currentPoints.length < 2) {
        updatedFeatures = [...currentPoints, newPoint];
      } else {
        const oldest = currentPoints.reduce((pointA, b) =>
          pointA.properties?.timeCreated < b.properties?.timeCreated ? pointA : b
        );
        updatedFeatures = [
          ...currentPoints.filter((pt) => pt.properties?.id !== oldest.properties?.id),
          newPoint,
        ];
      }

      updatePointsSource(updatedFeatures);
      if (updatedFeatures.length === 2) {
        createLine(updatedFeatures[0], updatedFeatures[1]);
      }
    };

    const onMouseDown = (e: MapMouseEvent) => {
      e.preventDefault();
      feature = e.features?.[0] as Feature<Point> | null;
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
      const point = e.features?.[0] as Feature<Point> | null;
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
      feature = null;
      map.off('click', onClick);
      map.off('mousedown', SubLayerId.MeasurePoints, onMouseDown);
      map.off('touchstart', SubLayerId.MeasurePoints, onTouchStart);
    };
  }, [drawMode]);
};
