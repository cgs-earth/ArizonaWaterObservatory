/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tabs } from '@mantine/core';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { Location } from '@/stores/main/types';
import { Tab } from './Tab';

type Props = {
  locations: Location[];
  panelOpen: boolean;
  from: string;
  to: string;
};

const Data: React.FC<Props> = (props) => {
  const { locations, panelOpen, from, to } = props;

  return (
    <Tabs
      defaultValue="layer"
      className={panelOpen ? styles.dataWrapperPartial : styles.dataWrapperFull}
    >
      <Tabs.List>
        <Tabs.Tab value="layer">By Layer</Tabs.Tab>
        <Tabs.Tab value="unit">By Unit</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="layer">
        <Tab locations={locations} from={from} to={to} />
      </Tabs.Panel>
      <Tabs.Panel value="unit">{JSON.stringify(locations)}</Tabs.Panel>
    </Tabs>
  );
};

export default Data;
