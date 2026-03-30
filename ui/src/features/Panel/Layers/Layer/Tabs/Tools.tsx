/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { Tabs } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';
import { Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import Search from '../Search';
import { Entry } from '../Search/Entry';

type Props = {
  layer: Layer;
  collectionType: CollectionType;
};

export const Tools: React.FC<Props> = (props) => {
  const { layer } = props;

  const [tab, setTab] = useState<string | null>();

  const handleTabChange = useCallback(
    (tab: string | null) => {
      setTab(tab);
    },
    [setTab]
  );

  return (
    <Tabs
      value={tab}
      color="var(--asu-color-primary)"
      classNames={{ panel: styles.content }}
      onChange={handleTabChange}
      defaultValue="search"
    >
      <Tabs.List>
        <Tabs.Tab value="search">Search</Tabs.Tab>
        {/* {showDataTab && <Tabs.Tab value="data">Data</Tabs.Tab>} */}
      </Tabs.List>
      <Tabs.Panel value="search">
        <Entry layer={layer} />
      </Tabs.Panel>
    </Tabs>
  );
};
