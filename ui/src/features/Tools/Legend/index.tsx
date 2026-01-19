/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState } from 'react';
import { Stack, Title, Tooltip } from '@mantine/core';
import LegendIcon from '@/assets/Legend';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import styles from '@/features/Tools/Tools.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { Content } from './Content';
import { ScreenshotUtility } from './ScreenshotUtility';

const Legend: React.FC = () => {
  const layers = useMainStore((state) => state.layers);

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const firstLayer = useRef(true);

  const [show, setShow] = useState(false);

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
      firstLayer.current = false;
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
    <>
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
          <Stack
            gap="var(--default-spacing)"
            className={`${styles.container} ${styles.legendWrapper}`}
          >
            <Title order={5} size="h3" className={styles.legendTitle}>
              Legend
            </Title>
            <Content layers={layers} showControls className={styles.legendContainer} />
          </Stack>
        }
      />
      <ScreenshotUtility layers={layers} />
    </>
  );
};

export default Legend;
