/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Title } from '@mantine/core';
import { Content } from '@/features/Tools/Legend/Content';
import styles from '@/features/Tools/Tools.module.css';
import { MainState } from '@/stores/main/types';

type Props = {
  layers: MainState['layers'];
};

const mapboxLogo = document.createElement('img');
mapboxLogo.src = '/mapbox-logo-black.png';
const asuLogo = document.createElement('img');
asuLogo.src = '/ASU-logo.png';
const cgsLogo = document.createElement('img');
cgsLogo.src = '/poweredbycgs_v2.png';

export const ScreenshotUtility: React.FC<Props> = (props) => {
  const { layers } = props;

  return (
    <Box
      style={{ height: 0, width: 0, overflow: 'hidden' }}
      ml="calc(var(--default-spacing) * -2)"
      mt="calc(var(--default-spacing) * -2)"
    >
      <Box className={styles.hiddenLegend} id="legend">
        <Title order={3} className={styles.mapToolTitle}>
          Legend
        </Title>
        <Content layers={layers} showControls={false} direction="column" />
      </Box>
      {/* These are used for attribution in the primary screenshot */}
      <img src="/mapbox-logo-black.png" id="mapbox-logo" alt="" aria-hidden />
      <img src="/ASU-logo.png" id="asu-logo" alt="" aria-hidden />
      <img src="/poweredbycgs_v2.png" id="cgs-logo" alt="" aria-hidden />
    </Box>
  );
};
