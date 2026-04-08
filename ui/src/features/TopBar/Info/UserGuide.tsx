/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { Box, Group } from '@mantine/core';
import Button from '@/components/Button';
import styles from '@/features/TopBar/TopBar.module.css';

export const UserGuide: React.FC = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleClick = () => {
    if (!iframeRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      iframeRef.current.requestFullscreen();
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  };

  return (
    <Group
      gap="calc(var(--default-spacing) * 2)"
      className={styles.userGuideGroup}
      align="flex-start"
    >
      <Box className={styles.userGuideWrapper}>
        <Box
          ref={iframeRef}
          component="iframe"
          title="AWO User Guide"
          loading="lazy"
          className={styles.userGuide}
          src="https://www.canva.com/design/DAHBDTBmL2Y/N5pajJxWWsiBAK1Cid1Qng/view?embed"
          allowFullScreen
          allow="fullscreen"
        />
      </Box>
      <Button onClick={handleClick}>Full Screen</Button>
    </Group>
  );
};
