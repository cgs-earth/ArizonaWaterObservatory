/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Fragment, useEffect, useRef, useState } from 'react';
import { Box, Divider, Stack, Title, Tooltip } from '@mantine/core';
import LegendIcon from '@/assets/Legend';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import { Entry } from '@/features/Tools/Legend/Entry';
import styles from '@/features/Tools/Tools.module.css';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

const Legend: React.FC = () => {
  const { map } = useMap(MAP_ID);

  const layers = useMainStore((state) => state.layers);

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const firstLayer = useRef(true);

  const [show, setShow] = useState(false);

  const handleColorChange = (color: Layer['color'], layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        color,
        layer.parameters,
        layer.from,
        layer.to,
        layer.visible,
        layer.opacity
      );
    }
  };

  const handleVisibilityChange = (visible: boolean, layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        layer.color,
        layer.parameters,
        layer.from,
        layer.to,
        visible,
        layer.opacity
      );

      if (map) {
        const layerIds = Object.values(
          mainManager.getLocationsLayerIds(layer.datasourceId, layerId)
        );
        for (const layerId of layerIds) {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
          }
        }
      }
    }
  };

  const handleOpacityChange = (opacity: number, layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        layer.color,
        layer.parameters,
        layer.from,
        layer.to,
        layer.visible,
        opacity
      );
    }
  };

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Legend : null);
    setShow(show);
  };

  useEffect(() => {
    if (overlay !== Overlay.Legend) {
      setShow(false);
    }
  }, [overlay]);

  useEffect(() => {
    if (firstLayer.current && layers.length > 0) {
      setShow(true);
      setOverlay(Overlay.Legend);
    }
  }, [layers]);

  useEffect(() => {
    if (overlay === Overlay.Legend && layers.length === 0) {
      setOverlay(null);
    }
  });

  return (
    <Popover
      offset={16}
      opened={show}
      onChange={setShow}
      closeOnClickOutside={false}
      classNames={{ dropdown: styles.legendContent }}
      position="bottom-start"
      target={
        <Tooltip
          label={layers.length > 0 ? 'View map legend.' : 'No layers added to legend.'}
          disabled={show}
        >
          <IconButton
            disabled={layers.length === 0}
            data-disabled={layers.length === 0}
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
          >
            <LegendIcon />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack gap={8} className={`${styles.container} ${styles.legendWrapper}`}>
          <Title order={5} size="h3" className={styles.legendTitle}>
            Legend
          </Title>
          <Box className={styles.legendContainer}>
            {layers.map((layer, index) => (
              <Fragment key={`legend-entry-${layer.id}`}>
                <Entry
                  layer={layer}
                  handleColorChange={handleColorChange}
                  handleVisibilityChange={handleVisibilityChange}
                  handleOpacityChange={handleOpacityChange}
                />
                {index < layers.length - 1 && <Divider />}
              </Fragment>
            ))}
          </Box>
        </Stack>
      }
    />
  );
};

export default Legend;
