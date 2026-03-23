/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoJsonProperties } from 'geojson';
import { EChartsSeries, Series } from '@/components/Charts/types';
import notificationManager from '@/managers/Notification.init';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';
import { NotificationType } from '@/stores/session/types';
import { isCoverageCollection } from '@/utils/isTypeObject';

export const aggregateProperties = <T extends GeoJsonProperties>(
  series: Series<T>[],
  properties: Array<keyof T>
): { source: string; name: string; value: number }[] => {
  const aggregatedProperties: {
    source: string;
    name: string;
    value: number;
  }[] = [];

  properties.forEach((property) => {
    series.forEach((_series) => {
      const features = _series.data.features;
      const average =
        features.reduce((sum, feature) => sum + Number(feature.properties![property]), 0) /
        features.length;
      aggregatedProperties.push({
        source: _series.name,
        name: String(property),
        value: average,
      });
    });
  });

  return aggregatedProperties;
};
