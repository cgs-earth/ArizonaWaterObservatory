/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '@mantine/core';
import styles from '@/features/Compare/Compare.module.css';
import { Tab } from '@/features/Compare/Data/Tab';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import { Location } from '@/stores/main/types';
import { TSimplifiedEntry } from '../types';

type Props = {
  locations: Location[];
  layerLocationGroups: LayerLocationGroups;
  layerEntries: TSimplifiedEntry[];
  panelOpen: boolean;
  from: string;
  to: string;
};

const Data: React.FC<Props> = (props) => {
  const { locations, layerEntries, layerLocationGroups, panelOpen, from, to } = props;

  return (
    <Box
      className={`${styles.dataWrapper} ${panelOpen ? styles.dataWrapperPartial : styles.dataWrapperFull}`}
    >
      <Tab
        layerEntries={layerEntries}
        locations={locations}
        layerLocationGroups={layerLocationGroups}
        from={from}
        to={to}
      />
    </Box>
  );
};

export default Data;
