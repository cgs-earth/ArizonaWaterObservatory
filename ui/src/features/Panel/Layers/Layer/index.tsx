/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useState } from 'react';
import { ComboboxData, Divider, Group, Stack, Text, Tooltip } from '@mantine/core';
import Delete from '@/assets/Delete';
import Button from '@/components/Button';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import IconButton from '@/components/IconButton';
import Select from '@/components/Select';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import Color from '@/features/Panel/Layers/Layer/Color';
import styles from '@/features/Panel/Panel.module.css';
import { OpacitySlider } from '@/features/Tools/Legend/OpacitySlider';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer as LayerType } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { isSamePalette, isValidPalette } from '@/utils/colors';
import { isSameArray } from '@/utils/compareArrays';
import { getParameterUnit } from '@/utils/parameters';
import { getTemporalExtent } from '@/utils/temporalExtent';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: LayerType;
};

const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const [name, setName] = useState(layer.name);
  const [color, setColor] = useState(layer.color);
  const [parameters, setParameters] = useState(layer.parameters);
  const [from, setFrom] = useState<string | null>(layer.from);
  const [minDate, setMinDate] = useState<string>();
  const [to, setTo] = useState<string | null>(layer.to);
  const [maxDate, setMaxDate] = useState<string>();
  const [opacity, setOpacity] = useState(layer.opacity);
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);
  const [paletteDefinition, setPaletteDefinition] = useState(layer.paletteDefinition);

  const [data, setData] = useState<ComboboxData>();
  const [isLoading, setIsLoading] = useState(false);

  const [parameterLimit, setParameterLimit] = useState<number>();
  const [daysLimit, setDaysLimit] = useState<number>();

  const { isFetchingCollections, isLoadingGeography } = useLoading();

  useEffect(() => {
    if (isFetchingCollections || data) {
      return;
    }

    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const collectionType = getCollectionType(collection);
      setCollectionType(collectionType);

      const temporalExtent = getTemporalExtent(collection);

      if (temporalExtent) {
        const { min, max } = temporalExtent;

        if (min) {
          setMinDate(min);
        }
        if (max) {
          setMaxDate(max);
        }
      }

      const paramObjects = Object.values(collection?.parameter_names ?? {});

      const data = paramObjects
        .map((object) => {
          const unit = getParameterUnit(object);

          return {
            label: `${object.name} (${unit})`,
            value: object.id,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      setData(data);
    }
  }, [isFetchingCollections]);

  useEffect(() => {
    const restrictions = CollectionRestrictions[layer.datasourceId];

    if (restrictions && restrictions.length > 0) {
      const parameterLimitRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Parameter
      );

      if (parameterLimitRestriction && parameterLimitRestriction.count > 0) {
        setParameterLimit(parameterLimitRestriction.count);
      }

      const daysLimitRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );

      if (daysLimitRestriction && daysLimitRestriction.days > 0) {
        setDaysLimit(daysLimitRestriction.days);
      }
    }
  }, [layer]);

  // If user updates color through the legend, update it here
  useEffect(() => {
    setColor(layer.color);
  }, [layer.color]);

  useEffect(() => {
    setOpacity(layer.opacity);
  }, [layer.opacity]);

  const handleSave = async () => {
    setIsLoading(true);
    const updateName = name !== layer.name ? `${layer.name} -> ${name}` : layer.name;
    const loadingInstance = loadingManager.add(
      `Updating layer: ${updateName}`,
      LoadingType.Locations
    );
    try {
      await mainManager.updateLayer(
        layer,
        name,
        color,
        parameters,
        from,
        to,
        layer.visible,
        opacity,
        paletteDefinition
      );
      notificationManager.show(`Updated layer: ${updateName}`, NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(layer.name);
    setColor(layer.color);
    setParameters(layer.parameters);
    setFrom(layer.from);
    setTo(layer.to);
    setOpacity(layer.opacity);
  };

  const handleDelete = () => {
    mainManager.deleteLayer(layer);
    notificationManager.show(`Deleted layer: ${layer.name}`, NotificationType.Success);
  };

  const handleOpacityChange = (opacity: LayerType['opacity'], _layerId: LayerType['id']) => {
    setOpacity(opacity);
  };

  const getIsDateRangeOverLimit = () => {
    if (daysLimit) {
      if (!from || !to || !dayjs(from).isValid() || !dayjs(to).isValid()) {
        return true;
      }

      return dayjs(to).diff(dayjs(from), 'days') > daysLimit;
    }
    return false;
  };

  /**
   * This layer is a grid type which requires at least one selected parameter
   *
   * @constant
   */
  const isMissingParameters = collectionType === CollectionType.EDRGrid && parameters.length === 0;
  /**
   * There is a parameter count limit on for this dataset and we have exceeded it
   *
   * @constant
   */
  const isParameterSelectionOverLimit = parameterLimit ? parameters.length > parameterLimit : false;
  /**
   * There is a limit to the number of days allowed within this range on for this dataset and we have exceeded it
   *
   * @constant
   */
  const isDateRangeOverLimit = getIsDateRangeOverLimit();
  /**
   * Is the to date before the from date if both exist
   *
   * @constant
   */
  const isValidRange = from && to ? dayjs(from).isSameOrBefore(dayjs(to)) : true;

  /**
   * This dataset supports date ranges
   *
   * @constant
   */
  const showDateInputs = [CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType);
  /**
   * This is a features dataset, show additional message
   *
   * @constant
   */
  const showFeaturesMessage = collectionType === CollectionType.Features;
  /**
   * Show additional warning about date ranges for EDRGrid
   *
   * @constant
   */
  const showDateRangeWarning = collectionType === CollectionType.EDRGrid;
  /**
   * This is a raster or grid layer which can meaningfully implement opacity
   *
   * @constant
   */
  const showOpacitySlider = [CollectionType.Map, CollectionType.EDRGrid].includes(collectionType);

  const isPaletteDefinitionValid = isValidPalette(paletteDefinition);

  const doesPaletteHaveParameter =
    !paletteDefinition || parameters.includes(paletteDefinition?.parameter);

  /**
   * The user has modified this layer since the last save
   *
   * @constant
   */
  const hasUnsavedChanges =
    name !== layer.name ||
    color !== layer.color ||
    !isSameArray(parameters, layer.parameters) ||
    from !== layer.from ||
    to !== layer.to ||
    !isSamePalette(paletteDefinition, layer.paletteDefinition);

  /**
   * This layer has validation issues or there are blocking actions
   *
   * @constant
   */
  const isSaveDisabled =
    isLoadingGeography ||
    !hasUnsavedChanges ||
    isLoading ||
    !isValidRange ||
    isMissingParameters ||
    isParameterSelectionOverLimit ||
    !doesPaletteHaveParameter ||
    !isPaletteDefinitionValid;
  const getDateInputError = () => {
    // is to >= from?
    if (isValidRange) {
      // is there a limit on days and have we exceeded it?
      if (daysLimit && isDateRangeOverLimit) {
        return `${dayjs(to).diff(dayjs(from), 'days') - daysLimit} day(s) over limit`;
      }
      return false;
    }

    return 'Invalid date range';
  };

  const getParameterError = () => {
    if (parameterLimit && isParameterSelectionOverLimit) {
      return `Please remove ${parameters.length - parameterLimit} parameter${parameters.length - parameterLimit > 1 ? 's' : ''}`;
    }

    return false;
  };

  const getSaveTooltip = () => {
    if (isLoadingGeography) {
      return 'Please wait for spatial filter to finish loading data.';
    }

    if (isLoading) {
      return 'Please wait for layer update to finish.';
    }
    if (!isValidRange || isDateRangeOverLimit) {
      return 'Please correct date range.';
    }
    if (isMissingParameters) {
      return 'Grid layers require at least one parameter.';
    }
    if (isParameterSelectionOverLimit) {
      return 'Please remove parameters.';
    }
    if (!isPaletteDefinitionValid) {
      return 'Please correct dynamic color settings.';
    }
    if (!doesPaletteHaveParameter) {
      return 'Dynamic color settings has invalid parameter.';
    }

    if (hasUnsavedChanges) {
      return 'Save changes to layer.';
    }

    return 'Layer has not been modified.';
  };

  const getCancelTooltip = () => {
    if (isLoadingGeography) {
      return 'Please wait for spatial filter to finish loading data.';
    }

    if (isLoading) {
      return 'Please wait for layer update to finish.';
    }
    if (!hasUnsavedChanges) {
      return 'Layer has not been modified.';
    }
    return null;
  };

  const handleColorChange = (color: LayerType['color']) => {
    setColor(color);
  };

  const handlePaletteDefinitionChange = (paletteDefinition: LayerType['paletteDefinition']) => {
    setPaletteDefinition(paletteDefinition);
  };

  const showPalette = collectionType === CollectionType.EDRGrid && data;

  return (
    <Stack gap="xs" className={styles.accordionContent}>
      <Group justify="space-between" gap="calc(var(--default-spacing) * 2)">
        <TextInput
          size="xs"
          w={showPalette ? '100%' : 'calc(49% - (var(--default-spacing) * 2))'}
          label="Layer Name"
          mr="auto"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Color
          collectionId={layer.datasourceId}
          parameters={parameters}
          parameterOptions={data}
          color={color}
          handleColorChange={handleColorChange}
          paletteDefinition={paletteDefinition}
          handlePaletteDefinitionChange={handlePaletteDefinitionChange}
          collectionType={collectionType}
        />
      </Group>
      {showFeaturesMessage && (
        <Text size="xs" mt={-4} c="var(--mantine-color-dimmed)">
          This is a features layer which contains no parameter values. Rendered data is a standard
          feature collection with accessible properties and no underlying data.
        </Text>
      )}
      {showDateInputs && (
        <>
          <Divider />
          <Group justify="space-between">
            <DateInput
              label="From"
              size="sm"
              className={styles.datePicker}
              placeholder="Pick start date"
              value={from}
              onChange={setFrom}
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
              size="sm"
              className={styles.datePicker}
              placeholder="Pick end date"
              value={to}
              onChange={setTo}
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
          {showDateRangeWarning && (
            <>
              <Text size="xs" mt={-4} c="var(--mantine-color-dimmed)">
                If no data renders after the layer is finished updating, increase the date range to
                find more data.
              </Text>
              <Divider />
            </>
          )}
          <Select
            size="sm"
            label="Parameter"
            description="Show locations that contain data for selected parameter(s). Please note if more than one parameter is selected, shown locations may not contain data for all selected parameters."
            placeholder="Select a Parameter"
            multiple
            clearable
            searchable
            data={data}
            value={parameters}
            onChange={setParameters}
            error={getParameterError()}
          />
        </>
      )}
      {showOpacitySlider && (
        <>
          <Divider />
          <OpacitySlider
            id={layer.id}
            opacity={opacity}
            handleOpacityChange={handleOpacityChange}
          />
        </>
      )}
      <Group justify="space-between" align="flex-end">
        <Group mt="md">
          <Tooltip label={getSaveTooltip()}>
            <Button
              size="xs"
              disabled={isSaveDisabled}
              data-disabled={isSaveDisabled}
              variant={Variant.Primary}
              onClick={() => handleSave()}
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
              onClick={() => handleCancel()}
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
            onClick={() => handleDelete()}
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

export default Layer;
