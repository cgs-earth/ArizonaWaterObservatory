/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { useEffect, useRef, useState } from 'react';
import { Group, Skeleton, Text, useComputedColorScheme } from '@mantine/core';
import LineChart from '@/components/Charts/LineChart';
import styles from '@/features/Popup/Popup.module.css';
import loadingManager from '@/managers/Loading.init';
import notificationManager from '@/managers/Notification.init';
import { CoverageCollection, CoverageJSON, ICollection } from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Location } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { getDatetime } from '@/utils/url';

type Props = {
  collectionId: ICollection['id'];
  locationId: Location['id'];
  title: string;
  parameters: string[];
  from: string | null;
  to: string | null;
  className?: string;
  onData?: () => void;
};

export const Chart: React.FC<Props> = (props) => {
  const {
    collectionId,
    locationId,
    parameters,
    from,
    to,
    className = '',
    onData = () => null,
  } = props;

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const computedColorScheme = useComputedColorScheme();

  const [data, setData] = useState<CoverageCollection | CoverageJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    const loadingInstance = loadingManager.add(
      `Fetching chart data for location: ${locationId}, of collection: ${collectionId}`,
      LoadingType.Data
    );
    setIsLoading(true);
    try {
      controller.current = new AbortController();

      const datetime = getDatetime(from, to);

      const coverageCollection = await awoService.getLocation<CoverageCollection | CoverageJSON>(
        collectionId,
        String(locationId),
        {
          signal: controller.current.signal,
          params: {
            'parameter-name': parameters.join(','),
            ...(datetime ? { datetime } : {}),
          },
        }
      );

      if (isMounted.current) {
        setData(coverageCollection);
        onData();
      }
    } catch (error) {
      if (
        (error as Error)?.name === 'AbortError' ||
        (typeof error === 'string' && error === 'Component unmount')
      ) {
        console.log('Fetch request canceled');
      } else if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
        setError(_error.message);
      }

      onData();
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    setData(null);
    setError(null);
    void fetchData();
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, [locationId, from, to]);

  return (
    <Skeleton visible={isLoading} className={`${className} ${styles.chartWrapper}`}>
      {data ? (
        <LineChart
          data={data}
          legend
          legendEntries={parameters}
          theme={computedColorScheme}
          filename={`line-chart-${locationId}-${parameters.join('-')}`}
        />
      ) : (
        <Group justify="center" align="center" className={styles.chartNoData}>
          <Text>No Data found for {parameters.join(', ')}</Text>
        </Group>
      )}
      {error && (
        <Text c="red">
          <strong>Error: </strong>
          {error}
        </Text>
      )}
    </Skeleton>
  );
};
