/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tabs } from '@mantine/core';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { Location } from '@/stores/main/types';

type Props = {
  locations: Location[];
  panelOpen: boolean;
};

const Data: React.FC<Props> = (props) => {
  const { locations, panelOpen } = props;

  return (
    <Tabs
      defaultValue="layer"
      className={panelOpen ? styles.dataWrapperPartial : styles.dataWrapperFull}
    >
      <Tabs.List>
        <Tabs.Tab value="layer">By Layer</Tabs.Tab>
        <Tabs.Tab value="unit">By unit</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="layer">{JSON.stringify(locations)}</Tabs.Panel>
      <Tabs.Panel value="unit">{JSON.stringify(locations)}</Tabs.Panel>
    </Tabs>
  );
};

export default Data;
