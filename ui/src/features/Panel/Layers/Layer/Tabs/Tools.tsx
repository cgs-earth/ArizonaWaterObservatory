/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { Tabs } from '@mantine/core';
import { Entry } from '@/features/Panel/Layers/Layer/Search/Entry';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
  showSearchTool: boolean;
  isLoading: boolean;
};

export const Tools: React.FC<Props> = (props) => {
  const { layer, isLoading, showSearchTool } = props;

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
      onChange={handleTabChange}
      defaultValue="search"
    >
      <Tabs.List>
        {showSearchTool && <Tabs.Tab value="search">Search</Tabs.Tab>}

        {/* {showDataTab && <Tabs.Tab value="data">Data</Tabs.Tab>} */}
      </Tabs.List>
      {showSearchTool && (
        <Tabs.Panel value="search">
          <Entry layer={layer} isLoading={isLoading} />
        </Tabs.Panel>
      )}
    </Tabs>
  );
};
