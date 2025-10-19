/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Fragment, useEffect, useState } from 'react';
import { ColorInput, Divider, Group, Stack, Switch, Text, Title, Tooltip } from '@mantine/core';
import Circle from '@/assets/Circle';
import LegendIcon from '@/assets/Legend';
import Line from '@/assets/Line';
import Square from '@/assets/Square';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Tools/Tools.module.css';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay, SessionState } from '@/stores/session/types';

export const Legend: React.FC = () => {
  const { map } = useMap(MAP_ID);

  const legendEntries = useSessionStore((state) => state.legendEntries);
  const setLegendEntries = useSessionStore((state) => state.setLegendEntries);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _layers = useMainStore((state) => state.layers);

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [show, setShow] = useState(false);

  const handleColorChange = (color: string, layerId: string, collectionId: string) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(layer, layer.name, color, layer.parameters);
      const oldEntry = legendEntries.filter((entry) => entry.layerId === layerId)[0];
      const newLegendEntries = legendEntries.filter((entry) => entry.layerId !== layerId);

      setLegendEntries([
        ...newLegendEntries,
        {
          layerId,
          collectionId,
          color,
          visible: oldEntry.visible,
        },
      ]);
    }
  };

  const handleVisibilityChange = (visible: boolean, layerId: string, collectionId: string) => {
    const oldEntry = legendEntries.filter((entry) => entry.layerId === layerId)[0];
    const newLegendEntries = legendEntries.filter((entry) => entry.layerId !== layerId);

    setLegendEntries([
      ...newLegendEntries,
      {
        layerId,
        collectionId,
        color: oldEntry.color,
        visible,
      },
    ]);
    const { pointLayerId, lineLayerId, fillLayerId } = mainManager.getLocationsLayerIds(
      collectionId,
      layerId
    );
    if (map) {
      [pointLayerId, lineLayerId, fillLayerId].forEach((layerId) =>
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
      );
    }
  };

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Legend : null);
    setShow(show);
  };

  useEffect(() => {
    if (!map) {
      return;
    }

    map.on('styledata', () => {
      const layers = useMainStore.getState().layers;
      const legendEntries = useSessionStore.getState().legendEntries;

      const mapLayers = map.getStyle().layers;
      const newLegendEntries: SessionState['legendEntries'] = [];

      mapLayers.forEach((mapLayer) => {
        if (
          mapLayer.type === 'circle' &&
          layers.some((layer) =>
            Object.values(mainManager.getLocationsLayerIds(layer.datasourceId, layer.id)).includes(
              mapLayer.id
            )
          ) &&
          mapLayer.paint
        ) {
          const layer = layers.find((layer) =>
            Object.values(mainManager.getLocationsLayerIds(layer.datasourceId, layer.id)).includes(
              mapLayer.id
            )
          );
          const color = mapLayer.paint['circle-color'];
          if (layer && typeof color === 'string') {
            newLegendEntries.push({
              layerId: layer.id,
              collectionId: layer.datasourceId,
              color: color ?? '#000',
              visible: legendEntries.find((entry) => entry.layerId === layer.id)?.visible ?? true,
            });
          }
        }
      });

      useSessionStore.getState().setLegendEntries(newLegendEntries);
    });
  }, [map]);

  useEffect(() => {
    if (overlay !== Overlay.Legend) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <Popover
      offset={16}
      opened={show}
      onChange={setShow}
      closeOnClickOutside={false}
      target={
        <Tooltip
          label={legendEntries.length > 0 ? 'View map legend' : 'No layers added to legend'}
          disabled={show}
        >
          <IconButton
            disabled={legendEntries.length === 0}
            data-disabled={legendEntries.length === 0}
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
          >
            <LegendIcon />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack gap={8} className={`${styles.container} ${styles.legendWrapper}`}>
          <Title order={5} size="h3">
            Legend
          </Title>

          {legendEntries
            .sort((a, b) => a.collectionId.localeCompare(b.collectionId))
            .map((entry, index) => (
              <Fragment key={`legend-entry-${entry.collectionId}`}>
                <Stack w="100%" gap="xs">
                  <Text size="lg" fw={700}>
                    {mainManager.getLayer(entry.layerId)?.name}
                  </Text>

                  <Group w="100%" justify="space-between" align="flex-start">
                    <Stack justify="flex-start">
                      <ColorInput
                        label={
                          <Text size="xs" mt={0}>
                            Symbol Color
                          </Text>
                        }
                        value={entry.color}
                        onChange={(color) =>
                          handleColorChange(color, entry.layerId, entry.collectionId)
                        }
                        className={styles.colorPicker}
                      />
                      <Switch
                        size="lg"
                        mb={4}
                        //   label={
                        //     <Text size="xs" my="5">
                        //       Visible
                        //     </Text>
                        //   }
                        onLabel="VISIBLE"
                        offLabel="HIDDEN"
                        checked={entry.visible}
                        onChange={(event) =>
                          handleVisibilityChange(
                            event.target.checked,
                            entry.layerId,
                            entry.collectionId
                          )
                        }
                      />
                    </Stack>
                    <Group gap="xs" justify="flex-start" align="flex-start">
                      <Stack className={styles.legendContrast} gap="xs">
                        <Circle fill={entry.color} />
                        <Line color={entry.color} />
                        <Square fill={entry.color} />
                        <Circle fill={entry.color} stroke="#fff" />
                      </Stack>
                      <Stack gap={10} pt={8} mt={0} align="flex-start">
                        <Text size="xs">Point Locations</Text>
                        <Text size="xs">Line Locations</Text>
                        <Text size="xs">Polygon Locations</Text>
                        <Stack gap={0}>
                          <Text size="xs">Selected Locations</Text>
                          <Text size="xs">(all shapes)</Text>
                        </Stack>
                      </Stack>
                    </Group>
                  </Group>
                </Stack>
                {index < legendEntries.length - 1 && <Divider />}
              </Fragment>
            ))}
        </Stack>
      }
    />
  );
};
