/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { v6 } from 'uuid';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import { ICollection } from '@/services/edr.service';
import { ColorValueHex, Layer } from '@/stores/main/types';
import { CollectionType } from '@/utils/collection';
import { getRandomHexColor } from '@/utils/hexColor';
import { getTemporalExtent } from '@/utils/temporalExtent';

export class FactoryService {
  /**
   * Creates a new v6 uuid
   *
   * @function
   */
  public createUUID(): string {
    return v6();
  }

  /**
   * Creates layer hex color
   *
   * @function
   */
  public createHexColor(): ColorValueHex {
    return getRandomHexColor();
  }

  public getTo(datasource: ICollection): dayjs.Dayjs {
    const temporalExtent = getTemporalExtent(datasource);

    if (temporalExtent) {
      const { max } = temporalExtent;
      if (max && dayjs(max).isValid()) {
        return dayjs(max);
      }
    }

    return dayjs();
  }

  public getFrom(datasourceId: ICollection['id'], collectionType: CollectionType, to: dayjs.Dayjs) {
    const restrictions = CollectionRestrictions[datasourceId];
    if (restrictions && restrictions.length > 0) {
      const dateRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );
      if (dateRestriction && dateRestriction.days) {
        return to.subtract(dateRestriction.days, 'day');
      }
    }

    return collectionType === CollectionType.EDRGrid
      ? to.subtract(1, 'year')
      : to.subtract(1, 'week');
  }

  /**
   *
   * @function
   */
  public getSourceId(collectionId: ICollection['id'], layerId: Layer['id']): string {
    return `user-${collectionId}-${layerId}-source`;
  }

  /**
   *
   * @function
   */
  public getLocationsLayerIds(
    collectionId: ICollection['id'],
    layerId: Layer['id']
  ): {
    pointLayerId: string;
    fillLayerId: string;
    lineLayerId: string;
    rasterLayerId: string;
  } {
    return {
      pointLayerId: `user-${collectionId}-${layerId}-point`,
      fillLayerId: `user-${collectionId}-${layerId}-fill`,
      lineLayerId: `user-${collectionId}-${layerId}-line`,
      rasterLayerId: `user-${collectionId}-${layerId}-raster`,
    };
  }

  public getFilterLayerId(collectionId: ICollection['id']): string {
    return `${collectionId}-filter`;
  }

  public getLabels(collectionType: CollectionType): {
    upperLabel: string;
    lowerLabel: string;
  } {
    switch (collectionType) {
      case CollectionType.EDR:
        return {
          upperLabel: 'Location',
          lowerLabel: 'location',
        };
      case CollectionType.EDRGrid:
        return {
          upperLabel: 'Grid',
          lowerLabel: 'grid',
        };

      case CollectionType.Features:
      default:
        return {
          upperLabel: 'Item',
          lowerLabel: 'item',
        };
    }
  }
}
