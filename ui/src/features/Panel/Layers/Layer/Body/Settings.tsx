/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComboboxData, Group, TextInput } from '@mantine/core';
import { Layer, PaletteDefinition } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import Color from '../Color';

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

export const Settings: React.FC<Props> = (props) => {
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

  return (
    <Group justify="space-between" gap="calc(var(--default-spacing) * 2)">
      <TextInput
        size="xs"
        w={showPalette || !showColorInput ? '100%' : 'calc(49% - (var(--default-spacing) * 2))'}
        label="Layer Name"
        mr="auto"
        value={name}
        onChange={(event) => onNameChange(event.currentTarget.value)}
      />
      {showColorInput && (
        <Color
          parameters={parameters}
          parameterOptions={parameterOptions}
          color={color}
          handleColorChange={onColorChange}
          paletteDefinition={paletteDefinition}
          handlePaletteDefinitionChange={onPaletteDefinitionChange}
          collectionType={collectionType}
        />
      )}
    </Group>
  );
};
