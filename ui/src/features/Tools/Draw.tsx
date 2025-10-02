/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DrawCreateEvent, DrawUpdateEvent } from '@mapbox/mapbox-gl-draw';
import { booleanIntersects, buffer, featureCollection, union } from '@turf/turf';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { Box, Stack } from '@mantine/core';
import Plus from '@/assets/Plus';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Tools/Tools.module.css';
import notificationManager from '@/managers/Notification.init';
import useSessionStore from '@/stores/session';
import { DrawMode, NotificationType } from '@/stores/session/types';
import { MAP_ID } from '../Map/config';

export const Draw: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [show, setShow] = useState(false);

  const { map, draw } = useMap(MAP_ID);

  const drawMode = useSessionStore((store) => store.drawMode);
  const setDrawMode = useSessionStore((store) => store.setDrawMode);

  useEffect(() => {
    if (!map || !draw) {
      return;
    }

    // Map is loaded and draw is set
    setLoaded(true);

    const combineFeatures = (feature: Feature<Polygon | MultiPolygon>) => {
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

        if (overlappingFeatures.length > 0) {
          let combined = feature;

          overlappingFeatures.forEach((feature) => {
            const unionShape = union(
              featureCollection<Polygon | MultiPolygon>([combined, feature])
            );
            if (unionShape) {
              combined = unionShape;
            }
          });

          const idsToDelete = overlappingFeatures.map((f) => String(f.id));
          draw.delete(idsToDelete);

          draw.delete(String(feature.id));

          draw.add(combined);
        }
      }
    };

    map.on('draw.create', (e: DrawCreateEvent) => {
      const feature = e.features[0] as Feature<Polygon | MultiPolygon>;
      combineFeatures(feature);
    });

    map.on('draw.update', (e: DrawUpdateEvent) => {
      console.log('draw.update', e);
      const feature = e.features[0] as Feature<Polygon | MultiPolygon>;
      combineFeatures(feature);
    });

    map.on('draw.modechange', (e) => {
      const { mode } = e;
      if (mode === 'draw_polygon') {
        setDrawMode(DrawMode.Polygon);
      } else {
        setDrawMode(null);
      }
    });
  }, [map, draw]);

  const handleShow = () => {
    setShow(!show);
  };

  const handlePolygon = () => {
    if (!draw) {
      return;
    }
    if (drawMode === DrawMode.Polygon) {
      setDrawMode(null);
      draw.changeMode('simple_select');
      return;
    }

    // Set manually, modechange wont detect a manual change
    setDrawMode(DrawMode.Polygon);
    draw.changeMode('draw_polygon');
    notificationManager.show(
      'Click on the map to add vertices. Click on the original point again to complete the shape.',
      NotificationType.Info,
      10000
    );
  };

  const handleTrash = () => {
    setDrawMode(null);
    if (!draw) {
      return;
    }

    draw.trash();
    draw.deleteAll();
  };

  return (
    <>
      {loaded && (
        <Stack>
          <IconButton variant={show ? Variant.Selected : Variant.Secondary} onClick={handleShow}>
            <Plus />
          </IconButton>
          {show && (
            <Box className={styles.container}>
              <IconButton
                variant={drawMode === DrawMode.Polygon ? Variant.Selected : Variant.Secondary}
                onClick={handlePolygon}
              >
                <Plus />
              </IconButton>
              <IconButton variant={Variant.Secondary} onClick={handleTrash}>
                <Plus />
              </IconButton>
            </Box>
          )}
        </Stack>
      )}
    </>
  );
};
