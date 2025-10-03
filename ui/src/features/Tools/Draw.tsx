/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { DrawCreateEvent, DrawUpdateEvent } from '@mapbox/mapbox-gl-draw';
import { booleanIntersects, buffer, featureCollection, union } from '@turf/turf';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { Group, Stack, Text, Title } from '@mantine/core';
import Plus from '@/assets/Plus';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Tools/Tools.module.css';
import { useMeasure } from '@/hooks/useMeasure';
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

  useMeasure(map, draw);

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

  const handleApply = () => {};

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
    notificationManager.show('Click outside the shape to deselect.', NotificationType.Info, 10000);
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
        <Popover
          offset={16}
          opened={show}
          onChange={setShow}
          target={
            <IconButton variant={show ? Variant.Selected : Variant.Secondary} onClick={handleShow}>
              <Plus />
            </IconButton>
          }
          content={
            <Stack className={styles.container} align="flex-start">
              <Title order={4}>Draw Tools</Title>
              <Group>
                <IconButton
                  variant={drawMode === DrawMode.Polygon ? Variant.Selected : Variant.Secondary}
                  onClick={handlePolygon}
                >
                  <Plus />
                </IconButton>
                <IconButton
                  variant={drawMode === DrawMode.Polygon ? Variant.Selected : Variant.Secondary}
                  onClick={() => setDrawMode(DrawMode.Measure)}
                >
                  <Plus />
                </IconButton>
              </Group>
              <Group>
                <Button size="sm" variant={Variant.Primary} onClick={handleApply}>
                  <Text size="sm">Apply</Text>
                </Button>
                <Button size="sm" variant={Variant.Tertiary} onClick={handleTrash}>
                  <Text size="sm">Clear All</Text>
                </Button>
              </Group>
            </Stack>
          }
        />
      )}
    </>
  );
};
