/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IRequestParams } from '@ogcapi-js/shared';
import { Loader, useComputedColorScheme } from '@mantine/core';
import { Tabbed } from '@/features/Charts/Tabbed';
import { ETabTypes, TCoverageLabel, TTypedOption, TWrappedCoverage } from '@/features/Charts/types';
import { Unmanaged } from '@/features/Charts/Unmanaged';
import {
  computeCoverageLabel,
  findReusableCoverage,
  findStaleCoverage,
  isValid,
} from '@/features/Charts/utils';
import { Parameter } from '@/features/Popup';
import loadingManager from '@/managers/Loading.init';
import notificationManager from '@/managers/Notification.init';
import { CoverageCollection, CoverageJSON, ICollection } from '@/services/edr.service';
import { Location } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { getDatetime } from '@/utils/url';

dayjs.extend(isSameOrBefore);

const MAX_STALE_ENTRIES = 5;

type Props = {
  collectionId: ICollection['id'];
  locationIds: Array<Location['id']>;
  parameters: Parameter[];
  from: string | null;
  to: string | null;
  className?: string;
  tabs?: boolean;
  select?: boolean;
  value?: string | null;
  tabHeight?: number;
  onData?: (data?: TWrappedCoverage[]) => void;
  getData: <T extends IRequestParams>(
    collectionId: ICollection['id'],
    locationId: Location['id'],
    params: T,
    signal?: AbortSignal
  ) => CoverageCollection | CoverageJSON | Promise<CoverageCollection | CoverageJSON>;
  coverageLabels?: TCoverageLabel;
};

export const Charts: React.FC<Props> = ({
  collectionId,
  locationIds,
  parameters,
  from,
  to,
  className,
  tabs = false,
  select = false,
  value = null,
  tabHeight,
  onData = () => null,
  getData,
  coverageLabels,
}) => {
  const controller = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  const computedColorScheme = useComputedColorScheme();

  const lastRequestKey = useRef<string | null>(null);

  const [data, setData] = useState<TWrappedCoverage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<TTypedOption[]>([]);

  const fetchData = async (signal: AbortSignal) => {
    const loadingInstance = loadingManager.add(
      `Fetching chart data for locations: ${locationIds.join(', ')} (${collectionId})`,
      LoadingType.Data
    );

    try {
      const datetime = getDatetime(from, to);
      const paramIds = parameters.map((p) => p.id);

      const params: IRequestParams = {
        'parameter-name': paramIds.join(','),
        ...(datetime ? { datetime } : {}),
      };

      const wrappedByLoc = new Map<string, TWrappedCoverage>();

      const staleEntries = findStaleCoverage(
        data.map(({ locationId, createdAt }) => ({ locationId, createdAt })),
        locationIds,
        MAX_STALE_ENTRIES
      );

      const currentDataSnapshot = data.filter((w) => !staleEntries.includes(w.locationId));

      const pending = locationIds
        .map((locationId, idx) => {
          const cached = findReusableCoverage(
            currentDataSnapshot,
            locationId,
            datetime ?? null,
            paramIds
          );

          if (cached) {
            wrappedByLoc.set(locationId, {
              data: cached.data,
              label: computeCoverageLabel(locationId, idx, cached.data, coverageLabels),
              locationId,
              params,
              collectionId,
              createdAt: Date.now(),
            });
            return null;
          }

          return { locationId, idx, params };
        })
        .filter(Boolean) as Array<{ locationId: string; idx: number; params: IRequestParams }>;

      const results = await Promise.allSettled(
        pending.map((p) => getData(collectionId, p.locationId, p.params, signal))
      );

      if (!isMounted.current) {
        return;
      }

      const rejected: PromiseRejectedResult[] = [];

      results.forEach((res, i) => {
        const { locationId, idx } = pending[i];

        if (res.status === 'fulfilled' && isValid(res.value)) {
          wrappedByLoc.set(locationId, {
            data: res.value,
            label: computeCoverageLabel(locationId, idx, res.value, coverageLabels),
            locationId,
            params,
            collectionId,
            createdAt: Date.now(),
          });
        } else if (
          res.status === 'rejected' &&
          res.reason !== 'Component unmount' &&
          !(typeof res.reason === 'string' && res.reason.includes('AbortError'))
        ) {
          rejected.push(res);
        }
      });

      const wrapped = locationIds
        .map((locId) => wrappedByLoc.get(locId))
        .filter(Boolean) as TWrappedCoverage[];

      setData(wrapped);

      if (rejected.length > 0) {
        notificationManager.show(
          `Some locations failed to load (${rejected.length}/${pending.length}).`,
          NotificationType.Info,
          8000
        );
      }

      setError(
        wrapped.length === 0 && rejected.length > 0
          ? 'Failed to load data for the requested locations.'
          : null
      );

      onData(wrapped);
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
      loadingManager.remove(loadingInstance);
    }
  };

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        collectionId,
        from,
        to,
        locationIds,
        parameters: parameters.map((p) => p.id),
      }),
    [collectionId, from, to, locationIds, parameters]
  );

  useEffect(() => {
    if (lastRequestKey.current === requestKey) {
      return;
    }

    const paramOptions = parameters.map(({ id, name, unit }) => ({
      value: id,
      label: `${name} (${unit})`,
      type: ETabTypes.Parameter,
    }));

    const unitOptions = Array.from(new Set(parameters.map((p) => p.unit))).map((unit) => ({
      value: unit,
      label: unit,
      type: ETabTypes.Unit,
    }));

    setOptions([...paramOptions, ...unitOptions]);

    lastRequestKey.current = requestKey;

    controller.current = new AbortController();

    isMounted.current = true;
    setError(null);

    const isValidRange = from && to ? dayjs(from).isSameOrBefore(dayjs(to)) : true;

    if (isValidRange) {
      setData([]);
      void fetchData(controller.current.signal);
    } else {
      setError('Invalid date range provided');
    }
  }, [locationIds, from, to, collectionId, parameters, coverageLabels]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  const chartData = useMemo(
    () =>
      data
        .filter((w) => locationIds.includes(w.locationId))
        .map((w) => w.data)
        .filter(Boolean),
    [data]
  );

  const seriesLabels = data
    .filter((w) => locationIds.includes(w.locationId))
    .map((w) => w.label ?? String(w.locationId));

  const showTabs = tabs && options.length > 0 && chartData.length > 0;
  const showUnmanaged = !select && !tabs && typeof value === 'string' && chartData.length > 0;

  return (
    <>
      {error && <>{error}</>}

      {showTabs && (
        <Tabbed
          collectionId={collectionId}
          data={chartData}
          locationIds={locationIds}
          theme={computedColorScheme}
          seriesLabels={seriesLabels}
          tabs={options}
          chartClassname={className}
          tabHeight={tabHeight}
        />
      )}

      {showUnmanaged && (
        <Unmanaged
          collectionId={collectionId}
          data={chartData}
          locationIds={locationIds}
          theme={computedColorScheme}
          seriesLabels={seriesLabels}
          entries={options}
          chartClassname={className}
          value={value}
        />
      )}

      {isLoading && <Loader type="dots" />}
    </>
  );
};
