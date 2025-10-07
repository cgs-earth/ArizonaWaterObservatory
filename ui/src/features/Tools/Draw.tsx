/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { Collapse, Group, Stack, Text, Title } from '@mantine/core';
import Plus from '@/assets/Plus';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Tools/Tools.module.css';
import { useDraw } from '@/hooks/useDraw';
import { useMeasure } from '@/hooks/useMeasure';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import useSessionStore from '@/stores/session';
import { DrawMode, LoadingType, NotificationType } from '@/stores/session/types';
import { MAP_ID } from '../Map/config';

export const Draw: React.FC = () => {
  const [show, setShow] = useState(false);

  const { map, draw } = useMap(MAP_ID);

  const drawMode = useSessionStore((store) => store.drawMode);
  const setDrawMode = useSessionStore((store) => store.setDrawMode);
  const drawnShapes = useSessionStore((store) => store.drawnShapes);
  const setDrawnShapes = useSessionStore((store) => store.setDrawnShapes);

  const loadingInstance = useRef<string>(null);

  useMeasure(map, draw);
  const { loaded: drawLoaded } = useDraw(map, draw);

  const applySpatialFilter = async (drawnShapes: Feature<Polygon | MultiPolygon>[]) => {
    const message =
      drawnShapes.length > 0 ? 'Applying spatial filters' : 'Clearing spatial filters';

    loadingInstance.current = loadingManager.add(message, LoadingType.Geography);

    try {
      await mainManager.applySpatialFilter(drawnShapes);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingInstance.current = loadingManager.remove(loadingInstance.current);
    }
  };

  const handleApply = async () => {
    void applySpatialFilter(drawnShapes);
  };

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

  const handleTrash = async () => {
    setDrawMode(null);
    if (!draw) {
      return;
    }

    setDrawnShapes([]);

    draw.trash();
    draw.deleteAll();
    void applySpatialFilter([]);
  };

  return (
    <>
      {drawLoaded && (
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
                <Button
                  size="sm"
                  variant={drawMode === DrawMode.Polygon ? Variant.Selected : Variant.Secondary}
                  onClick={handlePolygon}
                >
                  {drawMode === DrawMode.Polygon ? 'Cancel' : 'Draw'}
                </Button>
                <Button
                  size="sm"
                  variant={drawMode === DrawMode.Measure ? Variant.Selected : Variant.Secondary}
                  onClick={() => setDrawMode(DrawMode.Measure)}
                >
                  {drawMode === DrawMode.Measure ? 'Cancel' : 'Measure'}
                </Button>
                <Button
                  size="sm"
                  variant={drawMode === DrawMode.Select ? Variant.Selected : Variant.Secondary}
                  onClick={() => setDrawMode(DrawMode.Select)}
                  disabled
                >
                  {drawMode === DrawMode.Select ? 'Cancel' : 'Select'}
                </Button>
                <Collapse in={drawMode === DrawMode.Measure}>
                  <Text>{/* ... content */}</Text>
                </Collapse>
              </Group>
              <Group>
                <Button
                  size="sm"
                  variant={Variant.Primary}
                  onClick={handleApply}
                  disabled={drawnShapes.length === 0}
                >
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
