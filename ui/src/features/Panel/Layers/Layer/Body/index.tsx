/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ComboboxData, Tabs } from '@mantine/core';
import { Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { Data } from './Data';
import { Settings } from './Settings';

type Props = {
  collectionType: CollectionType;
  name: Layer['name'];
  onNameChange: (name: Props['name']) => void;
  color: Layer['color'];
  onColorChange: (color: Props['color']) => void;
  paletteDefinition: Layer['paletteDefinition'];
  onPaletteDefinitionChange: (paletteDefinition: Props['paletteDefinition']) => void;
  parameters: Layer['parameters'];
  parameterOptions: ComboboxData | undefined;
};

export const Body: React.FC<Props> = (props) => {
  const {
    collectionType,
    name,
    onNameChange,
    color,
    onColorChange,
    paletteDefinition,
    onPaletteDefinitionChange,
    parameters,
    parameterOptions,
  } = props;

  const [tab, setTab] = useState<string | null>();

  const handleTabChange = (tab: string | null) => setTab(tab);

  return (
    <Tabs value={tab} onChange={handleTabChange}>
      <Tabs.List>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Tab value="data">Data</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="settings">
        <Settings
          name={name}
          onNameChange={onNameChange}
          parameters={parameters}
          parameterOptions={parameterOptions}
          color={color}
          onColorChange={onColorChange}
          paletteDefinition={paletteDefinition}
          onPaletteDefinitionChange={onPaletteDefinitionChange}
          collectionType={collectionType}
        />
      </Tabs.Panel>
      <Tabs.Panel value="data">
        <Data />
      </Tabs.Panel>
    </Tabs>
  );
};
