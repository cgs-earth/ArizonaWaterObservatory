/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Box, Divider, Group, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Select from '@/components/Select';
import { Variant } from '@/components/types';
import { Parameter } from '@/features/Popup';
import styles from '@/features/Popup/Popup.module.css';
import { Layer, Location as LocationType } from '@/stores/main/types';

type Props = {
  location: LocationType;
  locations: LocationType[];
  feature: Feature;
  layer: Layer;
  datasetName: string;
  parameters: Parameter[];
  handleLocationChange: (id: string | null) => void;
  handleLinkClick: () => void;
};

export const Grid: React.FC<Props> = (props) => {
  const { location, locations, feature, parameters, handleLocationChange, handleLinkClick } = props;

  const [times, setTimes] = useState<{ value: string; label: string }[]>([]);
  const [time, setTime] = useState<{ value: string; label: string }>();
  const [displayValues, setDisplayValues] = useState<
    { value: string; label: string; unit: string }[]
  >([]);

  useEffect(() => {
    if (feature.properties) {
      const { times: rawTimes } = feature.properties as { times: string };

      const times = JSON.parse(rawTimes) as string[];

      if (
        times &&
        times.every((time) => typeof time === 'string') &&
        times.every((time) => dayjs(time).isValid())
      ) {
        setTimes(
          times.map((time) => ({ value: time, label: dayjs(time).format('MMMM D, YYYY h:mm A') }))
        );
      }
    }
  }, [feature]);

  useEffect(() => {
    if (times.length === 0 || times.some((timeObj) => timeObj.value === time?.value)) {
      return;
    }

    setTime(times[0]);
  }, [times]);

  useEffect(() => {
    const timeIndex = times.findIndex((timeObj) => timeObj.value === time?.value);
    if (timeIndex !== -1 && feature.properties) {
      const displayValues: { value: string; label: string; unit: string }[] = [];
      parameters.forEach((parameter) => {
        const rawValues = feature.properties![parameter.id];
        if (rawValues) {
          const values = JSON.parse(rawValues);
          const value = values[timeIndex];
          displayValues.push({
            label: parameter.name,
            value,
            unit: parameter.unit,
          });
        }
      });
      setDisplayValues(displayValues);
    }
  }, [time]);

  return (
    <>
      <Divider mt="calc(var(--default-spacing) / 2)" />
      {time && (
        <Text size="sm" mt="calc(var(--default-spacing) * 2)" mb="var(--default-spacing)">
          {time?.label}
        </Text>
      )}

      <ScrollArea scrollbars="x" type="hover" style={{ maxWidth: '100%' }}>
        <Group
          justify="flex-start"
          align="flex-start"
          mb="calc(var(--default-spacing) * 2)"
          wrap="nowrap"
        >
          {displayValues.map((displayValue) => (
            <Stack
              key={`${location.id}-${displayValue.label}-${displayValue.value}`}
              gap="var(--default-spacing)"
              miw={120}
            >
              <Text size="sm" fw={700}>
                {displayValue.label}
              </Text>
              <Text size="xs">
                {displayValue.value} ({displayValue.unit})
              </Text>
            </Stack>
          ))}
        </Group>
      </ScrollArea>
      <Group
        justify="space-between"
        align="flex-end"
        mt="var(--default-spacing)"
        mb="var(--default-spacing)"
      >
        <Group gap="var(--default-spacing)" align="flex-end">
          {locations.length > 1 && (
            <Select
              className={styles.locationsDropdown}
              size="xs"
              label="Locations"
              searchable
              data={locations.map((location) => location.id)}
              value={location.id}
              onChange={(value, _option) => handleLocationChange(value)}
            />
          )}
          {times.length > 1 && time && (
            <Select
              className={styles.timesDropdown}
              size="xs"
              label="Times"
              searchable
              data={times}
              value={time.value}
              onChange={(_value, option) => setTime(option)}
            />
          )}
        </Group>
        <Box component="span" className={styles.linkButtonWrapper}>
          <Tooltip label="Open this location in the Links modal.">
            <Button size="xs" onClick={handleLinkClick} variant={Variant.Primary}>
              Link
            </Button>
          </Tooltip>
        </Box>
      </Group>
    </>
  );
};
