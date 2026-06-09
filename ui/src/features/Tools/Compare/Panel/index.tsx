/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '@mantine/core';
import Collapsible from '@/components/Collapsible';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Tools/Compare/Compare.module.css';
import MiniMap from '../MiniMap';
import { MINI_MAP_ID } from '../MiniMap/consts';
import { Controls } from './Controls';

const Panel: React.FC = () => {
  const { map } = useMap(MINI_MAP_ID);

  const onOpen = () => {
    if (!map) {
      return;
    }

    map.resize();
  };

  return (
    <Collapsible
      width="25rem"
      collapseProps={{ h: '100%' }}
      groupProps={{ h: '100%' }}
      onOpen={onOpen}
    >
      <Box className={styles.panelWrapper}>
        <Controls />
        <Box className={styles.miniMapWrapper}>
          <MiniMap />
        </Box>
      </Box>
    </Collapsible>
  );
};

export default Panel;
