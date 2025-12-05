/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComboboxData, Group } from '@mantine/core';
import ColorInput from '@/components/ColorInput';
import { Popover } from '@/features/Panel/Layers/Layer/Color/Popover';
import { Color as ColorType, Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';

type Props = {
  parameters: string[];
  parameterOptions: ComboboxData | undefined;
  paletteDefinition: Layer['paletteDefinition'];
  handlePaletteDefinitionChange: (paletteDefinition: Layer['paletteDefinition']) => void;
  color: Layer['color'];
  handleColorChange: (color: Layer['color']) => void;
  collectionType: CollectionType;
};

const Color: React.FC<Props> = (props) => {
  const {
    parameters,
    parameterOptions,
    paletteDefinition,
    handlePaletteDefinitionChange,
    color,
    handleColorChange,
    collectionType,
  } = props;

  const showPalette = collectionType === CollectionType.EDRGrid && parameterOptions;

  return (
    <Group w={showPalette ? '100%' : 'calc(50% - (var(--default-spacing) * 2))'} align="flex-end">
      <ColorInput
        size="xs"
        label="Symbol Color"
        w={showPalette ? 'calc(50% - (var(--default-spacing) * 2))' : '100%'}
        value={typeof color === 'string' ? color : ''}
        onChange={(value) => handleColorChange(value as ColorType)}
      />
      {collectionType === CollectionType.EDRGrid && parameterOptions && (
        <Popover
          parameters={parameters}
          parameterOptions={parameterOptions}
          paletteDefinition={paletteDefinition}
          handleChange={handlePaletteDefinitionChange}
        />
      )}
    </Group>
  );
};

export default Color;
