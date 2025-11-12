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
import ColorInput from '@/components/ColorInput';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import IconButton from '@/components/IconButton';
import Select from '@/components/Select';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Panel.module.css';
import { OpacitySlider } from '@/features/Tools/Legend/OpacitySlider';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer as LayerType } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';

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
  const [to, setTo] = useState<string | null>(layer.to);
  const [opacity, setOpacity] = useState(layer.opacity);
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

  const [data, setData] = useState<ComboboxData>();
  const [isLoading, setIsLoading] = useState(false);

  const { isFetchingCollections } = useLoading();

  useEffect(() => {
    if (isFetchingCollections || data) {
      return;
    }

    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const collectionType = getCollectionType(collection);
      setCollectionType(collectionType);

      const paramObjects = Object.values(collection?.parameter_names ?? {});

      const data = paramObjects.map((object) => ({
        label: object.name,
        value: object.id,
      }));
      setData(data);
    }
  }, [isFetchingCollections]);

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
        opacity
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

  const isValidRange = from && to ? dayjs(from).isSameOrBefore(dayjs(to)) : true;
  const isMissingParameters = collectionType === CollectionType.EDRGrid && parameters.length === 0;

  const showDateInputs = [CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType);
  const showFeaturesMessage = collectionType === CollectionType.Features;
  const showDateRangeWarning = collectionType === CollectionType.EDRGrid;
  const showOpacitySlider = [CollectionType.Map, CollectionType.EDRGrid].includes(collectionType);

  return (
    <Stack gap="xs" className={styles.accordionContent}>
      <Group justify="space-between" grow gap={16}>
        <TextInput
          size="xs"
          label="Layer Name"
          mr="auto"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        {collectionType !== CollectionType.Map && (
          <ColorInput
            size="xs"
            label="Symbol Color"
            value={color}
            onChange={(value) => setColor(value)}
          />
        )}
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
              simplePresets={[
                DatePreset.Today,
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              clearable
              error={isValidRange ? false : 'Invalid date range'}
            />
            <DateInput
              label="To"
              size="sm"
              className={styles.datePicker}
              placeholder="Pick end date"
              value={to}
              onChange={setTo}
              simplePresets={[
                DatePreset.Today,
                DatePreset.OneYear,
                DatePreset.FiveYears,
                DatePreset.TenYears,
                DatePreset.FifteenYears,
                DatePreset.ThirtyYears,
              ]}
              clearable
              error={isValidRange ? false : 'Invalid date range'}
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
            description="Show locations that contain data for selected parameter(s). Please note if more than one parameter is selected, shown locations may not contain data for all selected parameters"
            placeholder="Select a Parameter"
            multiple
            clearable
            searchable
            data={data}
            value={parameters}
            onChange={setParameters}
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
          <Tooltip
            label={
              isLoading
                ? 'Please wait for layer update to finish.'
                : !isValidRange
                  ? 'Please correct date range.'
                  : isMissingParameters
                    ? 'Grid layers require at least one parameter.'
                    : null
            }
            disabled={!isLoading && isValidRange && !isMissingParameters}
          >
            <Button
              size="xs"
              disabled={isLoading || !isValidRange || isMissingParameters}
              data-disabled={isLoading || !isValidRange || isMissingParameters}
              variant={Variant.Primary}
              onClick={() => handleSave()}
            >
              Save
            </Button>
          </Tooltip>
          <Tooltip
            label={isLoading ? 'Please wait for layer update to finish.' : null}
            disabled={!isLoading}
          >
            <Button
              size="xs"
              disabled={isLoading}
              data-disabled={isLoading}
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
    </Stack>
  );
};

export default Layer;
