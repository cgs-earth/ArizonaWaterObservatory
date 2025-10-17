/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { featureCollection, length, lineString } from '@turf/turf';
import { Feature, LineString, Point } from 'geojson';
import { GeoJSONSource, Map, MapMouseEvent, MapTouchEvent, Popup } from 'mapbox-gl';
import { v6 } from 'uuid';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { SubLayerId } from '@/features/Map/config';
import { SourceId } from '@/features/Map/sources';
import useMainStore from '@/stores/main';
import { DrawMode } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { MeasureUnit } from '@/stores/session/slices/measure';
import { getUnitShorthand } from '@/utils/units';

export const useMeasure = (map: Map | null, draw: MapboxDraw | null, hoverPopup: Popup | null) => {
  const drawMode = useMainStore((store) => store.drawMode);
  const setPoints = useSessionStore((store) => store.setMeasurePoints);
  const measureLine = useSessionStore((store) => store.measureLine);
  const setLine = useSessionStore((store) => store.setMeasureLine);
  const unit = useSessionStore((store) => store.measureUnit);

  const updateLineSource = (feature: Feature<LineString>) => {
    if (!map) {
      return;
    }

    const collection = featureCollection([feature]);
    const source = map.getSource(SourceId.MeasureLine) as GeoJSONSource;
    source?.setData(collection);
    setLine(collection);
  };

  const updateLineString = (feature: Feature<LineString>, unit: MeasureUnit) => {
    const units = unit === 'kilometers' ? 'kilometers' : 'miles';

    let distance: string | number = length(feature, { units });

    if (unit === 'feet') {
      distance *= 5280;
    }

    const unitLabel = getUnitShorthand(unit);

    distance = distance.toFixed(2);

    const measuredLine = {
      ...feature,
      properties: {
        ...feature.properties,
        distance: `${Number(distance).toLocaleString('en-us')} ${unitLabel}`,
      },
    };

    updateLineSource(measuredLine);
  };

  useEffect(() => {
    if (!map || !hoverPopup) {
      return;
    }

    const handleLeave = () => {
      map.getCanvas().style.cursor = 'crosshair';
      hoverPopup.remove();
    };

    const handlePointsHover = (e: MapMouseEvent) => {
      const drawMode = useMainStore.getState().drawMode;

      let message = 'Activate the measure tool to interact with this point.';
      let cursor = '';

      if (drawMode === DrawMode.Measure) {
        message = 'Click and drag this point to adjust the line.';
        cursor = 'pointer';
      }
      map.getCanvas().style.cursor = cursor;

      const feature = e.features?.[0];
      if (feature) {
        const html = `<strong style="color:black;">${message}</strong>`;
        hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      }
    };

    const handleLineHover = (e: MapMouseEvent) => {
      const drawMode = useMainStore.getState().drawMode;

      if (drawMode !== DrawMode.Measure) {
        return;
      }

      const feature = e.features?.[0];
      if (feature) {
        const html = `<strong style="color:black;">Click in a new location to reposition the first point dropped, or click and drag the end points to adjust this line.</strong>`;
        hoverPopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
      }
    };

    map.on('mousemove', SubLayerId.MeasurePoints, handlePointsHover);
    map.on('mouseenter', SubLayerId.MeasurePoints, handlePointsHover);
    map.on('mouseleave', SubLayerId.MeasurePoints, handleLeave);
    map.on('mousemove', SubLayerId.MeasureLine, handleLineHover);
    map.on('mouseenter', SubLayerId.MeasureLine, handleLineHover);
    map.on('mouseleave', SubLayerId.MeasureLine, handleLeave);

    return () => {
      map.off('mousemove', SubLayerId.MeasurePoints, handlePointsHover);
      map.off('mouseenter', SubLayerId.MeasurePoints, handlePointsHover);
      map.off('mouseleave', SubLayerId.MeasurePoints, handleLeave);
      map.off('mousemove', SubLayerId.MeasureLine, handleLineHover);
      map.off('mouseenter', SubLayerId.MeasureLine, handleLineHover);
      map.off('mouseleave', SubLayerId.MeasureLine, handleLeave);
    };
  }, [map]);

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
      const unit = useSessionStore.getState().measureUnit;

      const line = lineString([pointA.geometry.coordinates, pointB.geometry.coordinates]);

      updateLineString(line, unit);
    };

    const onMove = (e: MapMouseEvent | MapTouchEvent) => {
      const source = map.getSource(SourceId.MeasurePoints) as GeoJSONSource;

      if (!source) {
        return;
      }

      if (feature) {
        const coords = e.lngLat;

        map.getCanvas().style.cursor = 'grabbing';

        const points = useSessionStore.getState().measurePoints;

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
      const drawMode = useMainStore.getState().drawMode;
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

      const currentPoints = useSessionStore.getState().measurePoints.features;
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

    // Draw action started, clear any current measurements
    map.on('draw.modechange', (e) => {
      const { mode } = e;
      if (mode !== 'simple_select') {
        clearMeasure();
      }
    });

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

  useEffect(() => {
    const line = measureLine.features[0];

    if (line) {
      updateLineString(line, unit);
    }
  }, [unit]);

  const clearMeasure = () => {
    if (!map) {
      return;
    }

    const points = getDefaultGeoJSON<Point>();
    const line = getDefaultGeoJSON<LineString>();

    const pointsSource = map.getSource(SourceId.MeasurePoints) as GeoJSONSource;
    const lineSource = map.getSource(SourceId.MeasureLine) as GeoJSONSource;

    setPoints(points);
    setLine(line);

    if (pointsSource) {
      pointsSource.setData(points);
    }

    if (lineSource) {
      lineSource.setData(line);
    }
  };

  return { clearMeasure };
};
