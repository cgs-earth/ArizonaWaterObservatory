/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Divider, Group, Stack, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import ColorInput from '@/components/ColorInput';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
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

type UpdateHandlers = {
  onDelete: () => void;
};

type Props = {
  layer: Layer;
  collectionType: CollectionType;
  attributes: Attributes;
  attributeHandlers: AttributeHandlers;
  updateHandlers: UpdateHandlers;
};

export const Settings: React.FC<Props> = (props) => {
  const {
    layer,
    collectionType,
    attributes: { name, color, from, to, opacity, parameters },
    attributeHandlers: { onNameChange, onColorChange, onFromChange, onToChange, onOpacityChange },
    updateHandlers: { onDelete },
  } = props;

  const { minDate, maxDate, getDateInputError, showColorInput } = useLayerValidation(layer, false, {
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
          <Tooltip label="Dynamic Visualization active" disabled={typeof color === 'string'}>
            <ColorInput
              size="xs"
              label="Symbol Color"
              className={styles.halfWidth}
              disabled={typeof color !== 'string'}
              value={typeof color === 'string' ? color : ''}
              onChange={(value) => onColorChange(value as Color)}
            />
          </Tooltip>
        )}
      </Group>
      {showDateInput && (
        <Group justify="space-between" gap="calc(var(--default-spacing) / 2)">
          <DateInput
            delay={150}
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
            delay={150}
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
      <Divider />
      <OpacitySlider id={layer.id} opacity={opacity} handleOpacityChange={onOpacityChange} />
      <Box mt="calc(var(--default-spacing) * 2)">
        <Button size="xs" variant={Variant.Primary} onClick={() => onDelete()}>
          Delete
        </Button>
      </Box>

      {/* {showOpacitySlider && (
        <>
          <Divider />
          <OpacitySlider id={layer.id} opacity={opacity} handleOpacityChange={onOpacityChange} />
        </>
      )} */}
    </Stack>
  );
};
