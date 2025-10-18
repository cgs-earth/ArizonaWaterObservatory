/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { Collapse, Group, Radio, RadioGroup, Stack, Text, Title, Tooltip } from '@mantine/core';
import DrawIcon from '@/assets/Draw';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Tools/Tools.module.css';
import { useDraw } from '@/hooks/useDraw';
import { useMeasure } from '@/hooks/useMeasure';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import useMainStore from '@/stores/main';
import { DrawMode } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { MeasureUnit } from '@/stores/session/slices/measure';
import { LoadingType, NotificationType, Overlay } from '@/stores/session/types';

export const Draw: React.FC = () => {
  const [show, setShow] = useState(false);

  const { map, draw, hoverPopup } = useMap(MAP_ID);

  const drawMode = useMainStore((store) => store.drawMode);
  const setDrawMode = useMainStore((store) => store.setDrawMode);
  const drawnShapes = useMainStore((store) => store.drawnShapes);
  const setDrawnShapes = useMainStore((store) => store.setDrawnShapes);
  const unit = useSessionStore((store) => store.measureUnit);
  const setUnit = useSessionStore((store) => store.setMeasureUnit);
  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  const loadingInstance = useRef<string>(null);

  const { clearMeasure } = useMeasure(map, draw, hoverPopup);
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

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Draw : null);
    setShow(show);
  };

  const handlePolygon = () => {
    if (!draw) {
      return;
    }

    if (drawMode === DrawMode.Polygon) {
      setDrawMode(null);
      draw.changeMode('simple_select');
    } else {
      // Set manually, modechange wont detect a manual change
      setDrawMode(DrawMode.Polygon);
      draw.changeMode('draw_polygon');
      notificationManager.show(
        'Finish drawing the shape, or click the cancel button to exit the draw tool.',
        NotificationType.Info,
        10000
      );
    }
  };

  const handleMeasure = () => {
    if (drawMode === DrawMode.Measure) {
      clearMeasure();
      setDrawMode(null);
      if (map) {
        map.getCanvas().style.cursor = '';
      }
    } else {
      setDrawMode(DrawMode.Measure);
      notificationManager.show(
        'Click two points on the map to measure the distance between.',
        NotificationType.Info,
        10000
      );
      if (map) {
        map.getCanvas().style.cursor = 'crosshair';
      }
    }
  };

  const handleTrash = async () => {
    setDrawMode(null);
    if (!draw || !map) {
      return;
    }

    setDrawnShapes([]);

    clearMeasure();

    draw.trash();
    draw.deleteAll();
    void applySpatialFilter([]);
  };

  useEffect(() => {
    if (drawMode !== DrawMode.Measure) {
      clearMeasure();
    }
    if (drawMode !== DrawMode.Polygon) {
      if (draw) {
        draw.changeMode('simple_select');
      }
    }
  }, [drawMode]);

  useEffect(() => {
    if (overlay !== Overlay.Draw) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <>
      {drawLoaded && (
        <Popover
          offset={16}
          opened={show}
          onChange={setShow}
          closeOnClickOutside={false}
          target={
            <Tooltip
              label="Measure distances and filter by drawn or existing geometries"
              disabled={show}
            >
              <IconButton
                variant={show ? Variant.Selected : Variant.Secondary}
                onClick={() => handleShow(!show)}
              >
                <DrawIcon />
              </IconButton>
            </Tooltip>
          }
          content={
            <Stack gap={8} className={styles.container} align="flex-start">
              <Title order={5} size="h3">
                Draw Tools
              </Title>
              <Group>
                <Button
                  size="sm"
                  className={styles.drawButton}
                  variant={drawMode === DrawMode.Polygon ? Variant.Selected : Variant.Secondary}
                  onClick={handlePolygon}
                >
                  <Text size="sm">{drawMode === DrawMode.Polygon ? 'Cancel' : 'Draw'}</Text>
                </Button>
                <Button
                  size="sm"
                  className={styles.drawButton}
                  variant={drawMode === DrawMode.Measure ? Variant.Selected : Variant.Secondary}
                  onClick={handleMeasure}
                >
                  <Text size="sm">{drawMode === DrawMode.Measure ? 'Cancel' : 'Measure'}</Text>
                </Button>
                <Tooltip label="Feature in development">
                  <Button
                    size="sm"
                    className={styles.drawButton}
                    variant={drawMode === DrawMode.Select ? Variant.Selected : Variant.Secondary}
                    onClick={() => setDrawMode(DrawMode.Select)}
                    disabled
                    data-disabled
                  >
                    <Text size="sm">{drawMode === DrawMode.Select ? 'Cancel' : 'Select'}</Text>
                  </Button>
                </Tooltip>
              </Group>
              <Collapse in={drawMode === DrawMode.Measure}>
                <RadioGroup
                  name="measure-unit"
                  label="Unit of Measure"
                  value={unit}
                  onChange={(value) => setUnit(value as MeasureUnit)}
                >
                  <Group mt={0}>
                    <Radio value="miles" label="Miles" />
                    <Radio value="feet" label="Feet" />
                    <Radio value="kilometers" label="Kilometers" />
                  </Group>
                </RadioGroup>
              </Collapse>
              <Group mt="md">
                <Tooltip
                  label={
                    drawnShapes.length === 0
                      ? 'Draw or select shapes to restrict shown locations'
                      : 'Apply shapes to shown locations'
                  }
                >
                  <Button
                    size="sm"
                    className={styles.drawButton}
                    variant={Variant.Primary}
                    onClick={handleApply}
                    disabled={drawnShapes.length === 0}
                    data-disabled={drawnShapes.length === 0}
                  >
                    <Text size="sm">Apply</Text>
                  </Button>
                </Tooltip>
                <Button
                  size="sm"
                  className={styles.drawButton}
                  variant={Variant.Tertiary}
                  onClick={handleTrash}
                >
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
