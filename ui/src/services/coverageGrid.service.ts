/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { bboxPolygon } from '@turf/turf';
import { BBox, FeatureCollection, Polygon } from 'geojson';
import { getDefaultGeoJSON } from '@/consts/geojson';
import {
  CoverageAxesSegments,
  CoverageAxesValues,
  CoverageCollection,
  CoverageJSON,
  ICollection,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { isCoverageJSON } from '@/utils/isTypeObject';
import { getDatetime } from '@/utils/url';

type Values = Record<string, (number | null)[]>;
type Axes = {
  t: { values: string[] };
  x: { start: number; stop: number; num: number };
  y: { start: number; stop: number; num: number };
};

export class CoverageGridService {
  private getLength({ start, stop, num }: { start: number; stop: number; num: number }): number {
    const length = Math.abs(stop - start) / num;

    return length;
  }

  private getValues(coverage: CoverageJSON): Values {
    const keys: Values = {};
    for (const key of Object.keys(coverage.parameters)) {
      keys[key] = coverage.ranges[key].values;
    }
    return keys;
  }

  private isSegments(
    axis: CoverageAxesSegments | CoverageAxesValues
  ): axis is CoverageAxesSegments {
    const a = axis as CoverageAxesSegments;
    return (
      typeof a?.start !== 'undefined' &&
      typeof a?.stop !== 'undefined' &&
      typeof a?.num !== 'undefined' &&
      typeof a.start === 'number' &&
      typeof a.stop === 'number' &&
      typeof a.num === 'number'
    );
  }

  private isValues(axis: CoverageAxesSegments | CoverageAxesValues): axis is CoverageAxesValues {
    return Array.isArray((axis as any)?.values);
  }

  private getAxes(coverage: CoverageJSON): Axes {
    return coverage.domain.axes as Axes;
  }

  private getCurrentValuesConstructor(
    count: number,
    values: Values,
    xCount: number,
    yCount: number
  ) {
    const keys = Object.keys(values);

    return (i: number, j: number): Values => {
      const currentValues: Values = {};

      for (const key of keys) {
        const flatValues = values[key];
        currentValues[key] = [];

        for (let k = 0; k < count; k++) {
          const index = k * (xCount * yCount) + j * xCount + i;
          currentValues[key].push(flatValues[index] ?? null);
        }
      }

      return currentValues;
    };
  }

  private addGridValuesConstructor(
    xValues: number[],
    yValues: number[],
    featureCollection: FeatureCollection<Polygon>,
    times: (string | number)[],
    values: Values
  ) {
    const count = times.length;

    const xLength = xValues.length;
    const yLength = yValues.length;

    const getCurrentValues = this.getCurrentValuesConstructor(count, values, xLength, yLength);
    let id = 1;

    return (x: number, y: number) => {
      const currentValues = getCurrentValues(x, y);

      // This grid entry would have no values to display
      if (Object.values(currentValues).every((array) => array.every((value) => value === null))) {
        return;
      }
      const startY = yValues[y];
      const endY = yValues[y + 1];

      const startX = xValues[x];
      const endX = xValues[x + 1];

      const grid = bboxPolygon([startX, startY, endX, endY], {
        id,
        properties: {
          times,
          gridIdentifier: `${startX}_${startY}_${endX}_${endY}`,
          ...currentValues,
        },
      });
      featureCollection.features.push(grid);
      id += 1;
    };
  }

  private createGridValues(
    timesObj: CoverageAxesValues,
    xObj: CoverageAxesValues,
    yObj: CoverageAxesValues,
    coverage: CoverageJSON
  ): FeatureCollection<Polygon> {
    let values: Values | null = this.getValues(coverage);

    const featureCollection = getDefaultGeoJSON<Polygon>();

    const addGrid = this.addGridValuesConstructor(
      xObj.values as number[],
      yObj.values as number[],
      featureCollection as FeatureCollection<Polygon>,
      timesObj.values,
      values
    );

    for (let y = 0; y < yObj.values.length - 1; y++) {
      for (let x = 0; x < xObj.values.length - 1; x++) {
        addGrid(x, y);
      }
    }
    values = null;

    return featureCollection;
  }

  private addGridSegmentConstructor(
    xStart: number,
    yStart: number,
    xLength: number,
    yLength: number,
    xCount: number,
    yCount: number,
    featureCollection: FeatureCollection<Polygon>,
    times: (string | number)[],
    values: Values
  ) {
    const count = times.length;

    const getCurrentValues = this.getCurrentValuesConstructor(count, values, xCount, yCount);

    let id = 1;

    return (x: number, y: number) => {
      const currentValues = getCurrentValues(x, y);

      // This grid entry would have no values to display
      if (Object.values(currentValues).every((array) => array.every((value) => value === null))) {
        return;
      }
      const startY = yStart - yLength * y;
      const endY = yStart - yLength * (y + 1);

      const startX = xStart + xLength * x;
      const endX = xStart + xLength * (x + 1);

      const grid = bboxPolygon([startX, startY, endX, endY], {
        id,
        properties: {
          times,
          gridIdentifier: `${startX}_${startY}_${endX}_${endY}`,
          ...currentValues,
        },
      });
      featureCollection.features.push(grid);
      id += 1;
    };
  }

  private createGridSegments(
    timesObj: CoverageAxesValues,
    xObj: CoverageAxesSegments,
    yObj: CoverageAxesSegments,
    coverage: CoverageJSON
  ): FeatureCollection<Polygon> {
    const xLength = this.getLength(xObj);
    const yLength = this.getLength(yObj);

    let values: Values | null = this.getValues(coverage);

    const featureCollection = getDefaultGeoJSON<Polygon>();

    const addGrid = this.addGridSegmentConstructor(
      xObj.start,
      yObj.start,
      xLength,
      yLength,
      xObj.num,
      yObj.num,
      featureCollection as FeatureCollection<Polygon>,
      timesObj.values,
      values
    );

    for (let y = 0; y < yObj.num; y++) {
      for (let x = 0; x < xObj.num; x++) {
        addGrid(x, y);
      }
    }
    values = null;

    return featureCollection;
  }

  private createGridCollection(coverage: CoverageJSON): FeatureCollection<Polygon> {
    if (coverage.domain.domainType !== 'Grid') {
      throw new Error(
        `Coverage domain type: ${coverage.domain.domainType} is not supported by grid builder`
      );
    }

    const { t, x: xObj, y: yObj } = this.getAxes(coverage);

    if (this.isSegments(xObj) && this.isSegments(yObj)) {
      return this.createGridSegments(t, xObj, yObj, coverage);
    }

    if (this.isValues(xObj) && this.isValues(yObj)) {
      return this.createGridValues(t, xObj, yObj, coverage);
    }

    throw new Error(
      'Mixed axis types are not supported (x and y must both be segments or both be values).'
    );
  }

  public async createGrid(
    collectionId: ICollection['id'],
    bbox: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection<Polygon>> {
    const datetime = getDatetime(from, to);

    const coverage = await awoService.getCube<CoverageJSON | CoverageCollection>(collectionId, {
      signal,
      params: {
        bbox,
        ...(parameterNames && parameterNames.length > 0
          ? { 'parameter-name': parameterNames.join(',') }
          : {}),
        ...(datetime ? { datetime } : {}),
        // TODO: remove this when support added for content-type headers
        f: 'json',
      },
    });

    if (isCoverageJSON(coverage)) {
      return this.createGridCollection(coverage);
    }

    // TODO: add support for coveragecollection
    return getDefaultGeoJSON<Polygon>();
  }
}
