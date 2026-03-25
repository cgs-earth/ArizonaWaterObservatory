/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExpressionSpecification } from 'mapbox-gl';
import { ComboboxData, Group, Stack, Text, Tooltip } from '@mantine/core';
import Delete from '@/assets/Delete';
import Button from '@/components/Button';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import IconButton from '@/components/IconButton';
import Select from '@/components/Select';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Panel.module.css';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import { useLoading } from '@/hooks/useLoading';
import { Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { isValidPalette } from '@/utils/colors';
import { DetailedGradient } from '../Color/DetailedGradient';
import { Popover } from '../Color/Popover';

type Attributes = {
  from: Layer['from'];
  to: Layer['to'];
  parameters: Layer['parameters'];
  paletteDefinition: Layer['paletteDefinition'];
  color: Layer['color'];
};

type AttributeHandlers = {
  onFromChange: (from: Attributes['from']) => void;
  onToChange: (to: Attributes['to']) => void;
  onParametersChange: (parameters: Attributes['parameters']) => void;
  onPaletteDefinitionChange: (paletteDefinition: Attributes['paletteDefinition']) => void;
  onPaletteDefinitionClear: () => void;
};

type UpdateHandlers = {
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
};

type Props = {
  layer: Layer;
  isLoading: boolean;
  collectionType: CollectionType;
  parameterOptions: ComboboxData | undefined;
  attributes: Attributes;
  attributeHandlers: AttributeHandlers;
  updateHandlers: UpdateHandlers;
};

export const Data: React.FC<Props> = (props) => {
  const {
    layer,
    isLoading,
    collectionType,
    parameterOptions,
    attributes: { from, to, parameters, paletteDefinition, color },
    attributeHandlers: {
      onFromChange,
      onToChange,
      onParametersChange,
      onPaletteDefinitionChange,
      onPaletteDefinitionClear,
    },
    updateHandlers: { onSave, onCancel, onDelete },
  } = props;

  const {
    minDate,
    maxDate,
    isSaveDisabled,
    hasUnsavedChanges,
    showPalette,
    getDateInputError,
    getParameterError,
    getSaveTooltip,
    getCancelTooltip,
  } = useLayerValidation(layer, isLoading, {
    parameters,
    from,
    to,
    parameterOptions,
    collectionType,
  });

  const { isLoadingGeography } = useLoading();

  const showDateInput = collectionType === CollectionType.EDRGrid;

  return (
    <Stack>
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

      <Select
        size="sm"
        label="Parameter"
        description="Show locations that contain data for selected parameter(s). Please note if more than one parameter is selected, shown locations may not contain data for all selected parameters."
        placeholder="Select a Parameter"
        multiple
        clearable
        searchable
        data={parameterOptions}
        value={parameters}
        onChange={onParametersChange}
        error={getParameterError()}
      />
      {showPalette && parameterOptions && (
        <Group gap="var(--default-spacing)" mt="var(--default-spacing)">
          <Text size="sm" fw={700}>
            Dynamic Visualization
          </Text>
          <Popover
            paletteDefinition={paletteDefinition}
            onChange={onPaletteDefinitionChange}
            parameters={parameters}
            parameterOptions={parameterOptions}
          />
          <IconButton
            disabled={!paletteDefinition}
            data-disabled={!paletteDefinition}
            onClick={onPaletteDefinitionClear}
            variant={Variant.Secondary}
          >
            <Delete />
          </IconButton>
        </Group>
      )}
      {layer.paletteDefinition &&
        isValidPalette(layer.paletteDefinition) &&
        typeof layer.color !== 'string' &&
        typeof color !== 'string' && (
          <DetailedGradient
            collectionId={layer.datasourceId}
            color={layer.color as ExpressionSpecification}
            paletteDefinition={layer.paletteDefinition}
          />
        )}
      <Group justify="space-between" align="flex-end">
        <Group mt="md">
          <Tooltip label={getSaveTooltip()}>
            <Button
              size="xs"
              disabled={isSaveDisabled}
              data-disabled={isSaveDisabled}
              variant={Variant.Primary}
              onClick={() => onSave()}
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip
            label={getCancelTooltip()}
            disabled={!isLoading && hasUnsavedChanges && !isLoadingGeography}
          >
            <Button
              size="xs"
              disabled={isLoading || !hasUnsavedChanges || isLoadingGeography}
              data-disabled={isLoading || !hasUnsavedChanges || isLoadingGeography}
              variant={Variant.Tertiary}
              onClick={() => onCancel()}
            >
              Cancel
            </Button>
          </Tooltip>
        </Group>
        <Tooltip label="Delete this layer instance" openDelay={500}>
          <IconButton
            variant={Variant.Primary}
            title="Remove layer"
            className={styles.actionIcon}
            onClick={() => onDelete()}
          >
            <Delete />
          </IconButton>
        </Tooltip>
      </Group>
      {hasUnsavedChanges && (
        <Text size="xs" c="red">
          Unsaved changes!
        </Text>
      )}
    </Stack>
  );
};
