/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import { ICollection } from '@/services/edr.service';
import { collectionService } from '@/services/init';
import { Layer } from '@/stores/main/types';

export class ValidationService {
  public checkParameterRestrictions(
    collectionId: ICollection['id'],
    parameters: Layer['parameters']
  ) {
    const restrictions = CollectionRestrictions[collectionId];
    if (restrictions && restrictions.length > 0) {
      const datasource = collectionService.getDatasource(collectionId);
      const parameterFirstRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.ParameterFirst
      );

      if (parameterFirstRestriction && parameters.length === 0) {
        const message = `Dataset: ${datasource?.title}, requires at least one parameter.`;
        throw new Error(message);
      }

      const parameterRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Parameter
      );

      if (parameterRestriction) {
        const hasNoParameters = parameters.length === 0;

        if (hasNoParameters || parameters.length > parameterRestriction.count) {
          let message = `Dataset: ${datasource?.title}, requires at least one and up to ${parameterRestriction.count} parameter${parameters.length - parameterRestriction.count > 1 ? 's' : ''} to be fetched at one time.`;
          if (hasNoParameters) {
            message += ' Please select at least one parameter.';
          } else {
            message += ` Please remove ${parameters.length - parameterRestriction.count} parameter${parameters.length - parameterRestriction.count > 1 ? 's' : ''}`;
          }

          throw new Error(message);
        }
      }
    }
  }

  public checkDateRestrictions(
    collectionId: ICollection['id'],
    from: Layer['from'],
    to: Layer['to']
  ) {
    const restrictions = CollectionRestrictions[collectionId];

    if (restrictions && restrictions.length > 0) {
      const dateRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );

      if (dateRestriction && dateRestriction.days) {
        const datasource = collectionService.getDatasource(collectionId);
        if (!from || !to) {
          throw new Error(
            `Dataset: ${datasource?.title}, requires a bounded date range of no longer than ${dateRestriction.days} days.`
          );
        }
        const diff = dayjs(to).diff(dayjs(from), 'days');

        if (diff > dateRestriction.days) {
          throw new Error(
            `Dataset: ${datasource?.title}, requires a bounded date range of no longer than ${dateRestriction.days}. Current date range is ${diff - dateRestriction.days} days too long.`
          );
        }
      }
    }
  }
}
