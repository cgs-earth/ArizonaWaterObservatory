/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
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

    map.on('draw.create', (e) => {
      console.log('draw.create', e);
    });
    map.on('draw.update', (e) => {
      console.log('draw.update', e);
    });
    // map.on('draw.render', (e) => {
    //   console.log('draw.render', e);
    // });
    map.on('draw.modechange', (e) => {
      console.log('draw.modechange', e);
    });
  }, [map, draw]);

  const handleShow = () => {
    setShow(!show);
  };

  const handlePolygon = () => {
    setDrawMode(drawMode !== DrawMode.Polygon ? DrawMode.Polygon : null);
    if (!draw) {
      return;
    }

    draw.changeMode('draw_polygon');
    notificationManager.show(
      'Click on the map to add vertices, click on the initial point again to complete the shape.',
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
