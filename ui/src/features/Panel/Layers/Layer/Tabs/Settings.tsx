/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Divider, Group, Stack } from '@mantine/core';
import ColorInput from '@/components/ColorInput';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import TextInput from '@/components/TextInput';
import styles from '@/features/Panel/Panel.module.css';
import { OpacitySlider } from '@/features/Tools/Legend/OpacitySlider';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import { Color, Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';

type Attributes = {
  name: Layer['name'];
  color: Layer['color'];
  from: Layer['from'];
  to: Layer['to'];
  opacity: Layer['opacity'];
  parameters: Layer['parameters'];
};

type AttributeHandlers = {
  onNameChange: (name: Attributes['name']) => void;
  onColorChange: (color: Attributes['color']) => void;
  onFromChange: (from: Attributes['from']) => void;
  onToChange: (to: Attributes['to']) => void;
  onOpacityChange: (opacity: Attributes['opacity']) => void;
};

type Props = {
  layer: Layer;
  collectionType: CollectionType;
  attributes: Attributes;
  attributeHandlers: AttributeHandlers;
};

export const Settings: React.FC<Props> = (props) => {
  const {
    layer,
    collectionType,
    attributes: { name, color, from, to, opacity, parameters },
    attributeHandlers: { onNameChange, onColorChange, onFromChange, onToChange, onOpacityChange },
  } = props;

  const { minDate, maxDate, getDateInputError, showColorInput, showOpacitySlider } =
    useLayerValidation(layer, false, {
      name,
      color,
      parameters,
      from,
      to,
      opacity,
      collectionType,
    });

  const showDateInput = collectionType === CollectionType.EDR;

  return (
    <Stack gap="var(--default-spacing)">
      <Group justify="space-between" gap="calc(var(--default-spacing) / 2)">
        <TextInput
          size="xs"
          label="Layer Name"
          className={showColorInput ? styles.halfWidth : styles.fullWidth}
          value={name}
          onChange={(event) => onNameChange(event.currentTarget.value)}
        />
        {showColorInput && (
          <ColorInput
            size="xs"
            label="Symbol Color"
            className={styles.halfWidth}
            disabled={typeof color !== 'string'}
            value={typeof color === 'string' ? color : ''}
            onChange={(value) => onColorChange(value as Color)}
          />
        )}
      </Group>
      {showDateInput && (
        <Group justify="space-between" gap="calc(var(--default-spacing) / 2)">
          <DateInput
            label="From"
            size="xs"
            className={styles.halfWidth}
            placeholder="Pick start date"
            value={from}
            onChange={onFromChange}
            minDate={minDate}
            maxDate={maxDate}
            simplePresets={[
              DatePreset.Today,
              DatePreset.OneYear,
              DatePreset.FiveYears,
              DatePreset.TenYears,
              DatePreset.FifteenYears,
              DatePreset.ThirtyYears,
            ]}
            clearable
            error={getDateInputError()}
          />
          <DateInput
            label="To"
            size="xs"
            className={styles.halfWidth}
            placeholder="Pick end date"
            value={to}
            onChange={onToChange}
            minDate={minDate}
            maxDate={maxDate}
            simplePresets={[
              DatePreset.Today,
              DatePreset.OneYear,
              DatePreset.FiveYears,
              DatePreset.TenYears,
              DatePreset.FifteenYears,
              DatePreset.ThirtyYears,
            ]}
            clearable
            error={getDateInputError()}
          />
        </Group>
      )}
      {showOpacitySlider && (
        <>
          <Divider />
          <OpacitySlider id={layer.id} opacity={opacity} handleOpacityChange={onOpacityChange} />
        </>
      )}
    </Stack>
  );
};
