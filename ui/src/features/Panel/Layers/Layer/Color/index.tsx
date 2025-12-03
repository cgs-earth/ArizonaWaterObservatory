/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComboboxData } from '@mantine/core';
import ColorInput from '@/components/ColorInput';
import styles from '@/features/Panel/Panel.module.css';
import { Color as ColorType, Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { Popover } from './Popover';

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

  return (
    <>
      {collectionType === CollectionType.EDRGrid && parameterOptions ? (
        <Popover
          parameters={parameters}
          parameterOptions={parameterOptions}
          paletteDefinition={paletteDefinition}
          handleChange={handlePaletteDefinitionChange}
        />
      ) : (
        typeof color === 'string' && (
          <ColorInput
            size="xs"
            label="Symbol Color"
            className={styles.layerInput}
            value={color}
            onChange={(value) => handleColorChange(value as ColorType)}
          />
        )
      )}
    </>
  );
};

export default Color;
