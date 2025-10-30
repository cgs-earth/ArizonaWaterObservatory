/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { bboxPolygon } from '@turf/turf';
import { FeatureCollection, Polygon } from 'geojson';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { isCoverageJSON } from '@/utils/isTypeObject';
import { CoverageCollection, CoverageJSON } from './edr.service';

type Values = Record<string, (number | null)[]>;

export class CovGridService {
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

  private addGridConstructor(
    xStart: number,
    yStart: number,
    xLength: number,
    yLength: number,
    xCount: number,
    yCount: number,
    featureCollection: FeatureCollection<Polygon>,
    count: number,
    values: Values
  ) {
    const getCurrentValues = this.getCurrentValuesConstructor(count, values, xCount, yCount);

    return (x: number, y: number) => {
      const currentValues = getCurrentValues(x, y);

      // This grid entry would have no
      if (Object.values(currentValues).every((array) => array.every((value) => value === null))) {
        return;
      }
      const startY = yStart - yLength * y;
      const endY = yStart - yLength * (y + 1);

      const startX = xStart + xLength * x;
      const endX = xStart + xLength * (x + 1);

      const grid = bboxPolygon([startX, startY, endX, endY]);
      featureCollection.features.push(grid);
    };
  }

  private createGridCollection(coverage: CoverageJSON): FeatureCollection<Polygon> {
    if (coverage.domain.domainType !== 'Grid') {
      throw new Error(
        `Coverage domain type: ${coverage.domain.domainType} is not supported by grid builder`
      );
    }

    const {
      t,
      x: xObj,
      y: yObj,
    } = coverage.domain.axes as {
      t: { values: number[] };
      x: { start: number; stop: number; num: number };
      y: { start: number; stop: number; num: number };
    };

    const count = t.values.length;

    const xLength = this.getLength(xObj);
    const yLength = this.getLength(yObj);

    let values: Values | null = this.getValues(coverage);

    const featureCollection = getDefaultGeoJSON<Polygon>();

    const addGrid = this.addGridConstructor(
      xObj.start,
      yObj.start,
      xLength,
      yLength,
      xObj.num,
      yObj.num,
      featureCollection as FeatureCollection<Polygon>,
      count,
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

  public async createGrid(url: string): Promise<FeatureCollection<Polygon>> {
    const results = await fetch(url);
    const coverage = (await results.json()) as CoverageJSON | CoverageCollection;

    if (isCoverageJSON(coverage)) {
      return this.createGridCollection(coverage);
    }

    // TODO: add support for coveragecollection
    return getDefaultGeoJSON<Polygon>();
  }
}
