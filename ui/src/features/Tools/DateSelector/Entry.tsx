/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { Map } from 'mapbox-gl';
import { ComboboxData, Loader, Text } from '@mantine/core';
import Select from '@/components/Select';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import { getDates } from '@/features/Tools/DateSelector/utils';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';

type Props = {
  layer: Layer;
};

export const Entry: React.FC<Props> = (props) => {
  const { layer } = props;

  const [data, setData] = useState<ComboboxData>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { map } = useMap(MAP_ID);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const handleDatesFetch = async (map: Map, layer: Layer) => {
    const loadingInstance = loadingManager.add(
      `Retrieving dates for ${layer.name}`,
      LoadingType.Data
    );
    setIsLoading(true);
    try {
      const dates = await getDates(map, layer);

      const data: ComboboxData = dates.map((date, index) => ({
        value: String(index),
        label: dayjs(date).format('MM/DD/YYYY'),
      }));

      if (isMounted.current) {
        setData(data);
      }
    } catch (err) {
      const error = err as Error;
      if ((error?.message ?? '').length > 0 && error?.name !== 'AbortError') {
        notificationManager.show((err as Error)?.message, NotificationType.Error, 10000);
      } else if (typeof err === 'string') {
        notificationManager.show(err, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const handleIndexChange = async (index: number) => {
    if (!layer.paletteDefinition) {
      return;
    }

    const loadingInstance = loadingManager.add(
      `Updating coloration for ${layer.name}`,
      LoadingType.Data
    );

    try {
      controller.current = new AbortController();
      const paletteDefinition = {
        ...layer.paletteDefinition,
        index,
      };
      if (!controller.current) {
        controller.current = new AbortController();
      }

      void mainManager.styleLayer(layer, paletteDefinition, undefined, controller.current.signal);
    } catch (err) {
      const error = err as Error;
      if ((error?.message ?? '').length > 0 && error?.name !== 'AbortError') {
        notificationManager.show((err as Error)?.message, NotificationType.Error, 10000);
      } else if (typeof err === 'string') {
        notificationManager.show(err, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    void handleDatesFetch(map, layer);
  }, []);

  const handleChange = (value: string | null) => {
    const index = Number(value);
    if (!isNaN(index)) {
      void handleIndexChange(index);
    }
  };

  if (!layer.paletteDefinition) {
    return null;
  }

  return (
    <>
      {isLoading ? (
        <Loader color="var(--asu-color-primary)" />
      ) : (
        <Select
          size="sm"
          label={
            <Text size="sm" lineClamp={1} title={`${layer.name} Date`}>
              {layer.name} Date
            </Text>
          }
          placeholder="Select..."
          data={data}
          value={String(layer.paletteDefinition.index)}
          onChange={handleChange}
          disabled={data.length === 0}
          searchable
        />
      )}
    </>
  );
};
