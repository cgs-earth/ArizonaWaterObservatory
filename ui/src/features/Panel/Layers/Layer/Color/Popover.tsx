/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { ExpressionSpecification } from 'mapbox-gl';
import { ComboboxData, ComboboxItem, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import Basemap from '@/assets/Basemap';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import PopoverComponent from '@/components/Popover';
import Select from '@/components/Select';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Panel.module.css';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { createColorRange, createStaticStepExpression, groupData } from '@/utils/colors';
import {
  ColorBrewerIndex,
  FriendlyColorBrewerPalettes,
  isValidColorBrewerIndex,
  isValidThresholdArray,
  validColorBrewerIndex,
  ValidThresholdArray,
} from '@/utils/colors/types';
import { Gradient } from './Gradient';

// C:\Users\jsalman\source\ArizonaWaterObservatory\ui\src\features\Panel\Layers\Layer\Color\Popover.tsx

type Props = {
  paletteDefinition: Layer['paletteDefinition'];
  handleChange: (paletteDefinition: Layer['paletteDefinition']) => void;
  parameters: string[];
  parameterOptions: ComboboxData;
};

export const Popover: React.FC<Props> = (props) => {
  const { parameters, parameterOptions, paletteDefinition, handleChange } = props;

  const [show, setShow] = useState(false);

  const [palette, setPalette] = useState<FriendlyColorBrewerPalettes | null>(
    paletteDefinition?.palette ?? null
  );
  const [colors, setColors] = useState<string[]>([]);

  const [parameter, setParameter] = useState<string | null>(paletteDefinition?.parameter ?? null);
  const [count, setCount] = useState<ColorBrewerIndex | null>(paletteDefinition?.count ?? null);

  useEffect(() => {
    if (count === null || palette === null) {
      return;
    }

    const colors = createColorRange(count, palette);
    setColors(colors);
  }, [count, palette]);

  const handleSave = () => {
    if (palette !== null && count !== null && parameter !== null) {
      handleChange({ palette, count, parameter });
      setShow(false);
    }
  };

  const handleCancel = () => {
    setPalette(paletteDefinition?.palette ?? null);
    setParameter(paletteDefinition?.parameter ?? null);
    setCount(paletteDefinition?.count ?? null);
    setShow(false);
  };

  const isValidPalette = palette !== null && count !== null && parameter !== null;

  return (
    <PopoverComponent
      offset={16}
      opened={show}
      onChange={setShow}
      closeOnClickOutside={false}
      target={
        <Tooltip label="Change map styling." disabled={show}>
          <IconButton
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => setShow(!show)}
          >
            <Basemap />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack gap={8} className={styles.container} align="flex-start">
          <Title order={5} size="h3">
            Color
          </Title>
          <Group>
            <Stack gap={8}>
              <Select
                size="xs"
                label="Groups"
                data={validColorBrewerIndex.map((index) => String(index))}
                onChange={(value: string | null) => {
                  const count = Number(value);
                  if (isValidColorBrewerIndex(count)) {
                    setCount(count);
                  }
                }}
              />
              <Select
                size="xs"
                label="Parameters"
                data={parameterOptions.filter((option) =>
                  parameters.includes((option as ComboboxItem).value)
                )}
                onChange={(value: string | null) => {
                  if (value) {
                    setParameter(value);
                  }
                }}
              />
              <Select
                size="xs"
                label="Palette"
                data={Object.values(FriendlyColorBrewerPalettes)}
                onChange={(value: string | null) => {
                  if (value) {
                    setPalette(value as FriendlyColorBrewerPalettes);
                  }
                }}
              />
            </Stack>
            {parameter && colors.length > 0 ? (
              <Gradient label={parameter} colors={colors} left="Less" right="More" />
            ) : (
              <Text size="xs">Please select parameter, count, and palette.</Text>
            )}
          </Group>
          <Group mt="md" justify="center">
            <Tooltip label="Invalid palette configuration." disabled={isValidPalette}>
              <Button
                size="xs"
                disabled={!isValidPalette}
                data-disabled={!isValidPalette}
                variant={Variant.Primary}
                onClick={() => handleSave()}
              >
                Ok
              </Button>
            </Tooltip>
            <Tooltip label="Undo palette changes">
              <Button size="xs" variant={Variant.Tertiary} onClick={() => handleCancel()}>
                Cancel
              </Button>
            </Tooltip>
          </Group>
        </Stack>
      }
    />
  );
};
