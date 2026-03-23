/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { XAXisOption } from 'echarts/types/dist/shared';
import { EChartsSeries } from '@/components/Charts/types';
import notificationManager from '@/managers/Notification.init';
import { CoverageService } from '@/services/coverageJSON/coverage.service';
import { TChartData, TCoverageOptions, TOptions } from '@/services/coverageJSON/types';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';
import { NotificationType } from '@/stores/session/types';
import { isAxesValues, isCoverageCollection } from '@/utils/isTypeObject';
import { getParameterUnit } from '@/utils/parameters';

export class CoverageChartService extends CoverageService {
  private processVerticalProfile(coverage: CoverageJSON, options?: TCoverageOptions) {
    const coverageParameters = coverage.parameters ?? options?.parameters;

    if (!coverage.ranges) {
      notificationManager.show('Missing ranges in coverage data', NotificationType.Error, 10000);
      return [];
    }

    const series: EChartsSeries[] = [];

    const filteredRanges = Object.entries(coverage.ranges).filter(([parameterId]) => {
      if (options?.chosenParameter) {
        return parameterId === options?.chosenParameter;
      }

      if (options?.chosenUnit) {
        const parameter = coverageParameters[parameterId];
        const unit = getParameterUnit(parameter);

        return unit === options?.chosenUnit;
      }

      return true;
    });

    for (const [parameterId, range] of filteredRanges) {
      if (!range.values) {
        console.warn(`Skipping ${parameterId} due to mismatched or missing values`);
        continue;
      }

      // TODO: add multi language support
      // TODO: switch so that name is the label
      const parameter = coverageParameters[parameterId];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const unit = getParameterUnit(parameter);

      series.push({
        name: parameterId,
        // parameter: parameter.id,
        // unit,
        type: 'line',
        data: range.values,
      });
    }

    return series;
  }

  private processPointSeries(coverage: CoverageJSON, options?: TCoverageOptions) {
    const dates = (coverage.domain.axes.t as { values: string[] }).values;
    const coverageParameters = coverage.parameters ?? options?.parameters;

    if (!coverage.ranges || !dates) {
      notificationManager.show(
        'Missing ranges or date axis in coverage data',
        NotificationType.Error,
        10000
      );
      return [];
    }

    const series: EChartsSeries[] = [];

    const filteredRanges = Object.entries(coverage.ranges).filter(([parameterId]) => {
      if (options?.chosenParameter) {
        return parameterId === options?.chosenParameter;
      }

      if (options?.chosenUnit) {
        const parameter = coverageParameters[parameterId];
        const unit = getParameterUnit(parameter);

        return unit === options?.chosenUnit;
      }

      return true;
    });

    for (const [parameterId, range] of filteredRanges) {
      if (!range.values || range.values.length !== dates.length) {
        console.warn(`Skipping ${parameterId} due to mismatched or missing values`);
        continue;
      }

      // TODO: add multi language support
      // TODO: switch so that name is the label
      const parameter = coverageParameters[parameterId];

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const unit = getParameterUnit(parameter);

      series.push({
        name: parameterId,
        // parameter: parameter.id,
        // unit,
        type: 'line',
        data: range.values,
      });
    }

    return series;
  }

  private coverageCollectionToSeries(coverage: CoverageCollection, options?: TOptions) {
    const parameters = coverage.parameters as CoverageJSON['parameters'];

    const curryCoverageToSeries = (coverage: CoverageJSON) => {
      return this.coverageToSeries(coverage, {
        parameters,
        chosenParameter: options?.chosenParameter,
        chosenUnit: options?.chosenUnit,
      });
    };

    return coverage.coverages.flatMap(curryCoverageToSeries);
  }

  private coverageToSeries(coverage: CoverageJSON, options?: TCoverageOptions) {
    if (coverage.domain.domainType === 'PointSeries') {
      return this.processPointSeries(coverage, options);
    }

    if (coverage.domain.domainType === 'VerticalProfile') {
      return this.processVerticalProfile(coverage, options);
    }

    notificationManager.show(
      `Domain type ${coverage.domain.domainType} is not currently supported.`,
      NotificationType.Error,
      10000
    );
    return [];
  }

  private processXAxis(coverage: CoverageJSON): XAXisOption {
    const { ranges } = coverage;

    const organizedAxisNames = this.getAxisNames(ranges);

    if (organizedAxisNames.length === 1 && organizedAxisNames[0].axisNames.length === 1) {
      const axis = organizedAxisNames[0].axisNames[0];
      const axes = coverage.domain.axes[axis];

      if (!isAxesValues(axes)) {
        console.warn('Unable to process: ', axes);
        return {};
      }

      const values = axes.values;

      if (values.length === 0) {
        console.warn('No values: ', axes);
        return {};
      }

      let name = undefined;
      if (coverage.domain.domainType === 'VerticalProfile') {
        const { referencing } = coverage.domain;

        const reference = referencing.find((reference) =>
          reference.coordinates.some((coordinate) => coordinate === axis)
        );

        if (reference) {
          if (reference.system.type === 'VerticalCRS') {
            name = reference.system.id;
          }
        }
      }

      return {
        type: 'category',
        boundaryGap: false,
        data: values,
        name,
        nameLocation: 'middle',
        nameGap: 25,
      };
    }

    if (coverage.domain.domainType === 'PointSeries') {
      const dates = isCoverageCollection(coverage)
        ? (coverage.coverages[0]?.domain.axes.t as { values: string[] }).values
        : (coverage.domain.axes.t as { values: string[] }).values;

      return {
        type: 'category',
        boundaryGap: false,
        data: dates,
      };
    }

    if (coverage.domain.domainType === 'PointSeries') {
      const dates = isCoverageCollection(coverage)
        ? (coverage.coverages[0]?.domain.axes.t as { values: string[] }).values
        : (coverage.domain.axes.t as { values: string[] }).values;

      return {
        type: 'category',
        boundaryGap: false,
        data: dates,
      };
    }

    return {};
  }

  public coverageJSONToSeries(
    coverage: CoverageCollection | CoverageJSON,
    options?: TOptions
  ): TChartData {
    if (isCoverageCollection(coverage)) {
      return {
        x: this.processXAxis(coverage.coverages[0]),
        series: this.coverageCollectionToSeries(coverage, options),
      };
    }

    return { x: this.processXAxis(coverage), series: this.coverageToSeries(coverage, options) };
  }
}
