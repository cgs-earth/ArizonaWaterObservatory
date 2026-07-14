/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import * as turf from '@turf/turf';
import {
  BBox,
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  MultiPolygon,
  Point,
  Polygon,
} from 'geojson';
import { StoreApi, UseBoundStore } from 'zustand';
import { getBBox } from '@/consts/bbox';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import { DEFAULT_BBOX } from '@/features/Map/consts';
import { ICollection } from '@/services/edr.service';
import { collectionService } from '@/services/init';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { MainState } from '@/stores/main/types';

export class SpatialService {
  private store: UseBoundStore<StoreApi<MainState>>;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
  }

  private checkCollectionBBoxRestrictions(collectionId: ICollection['id'], bbox: BBox) {
    const restrictions = CollectionRestrictions[collectionId];

    if (restrictions && restrictions.length > 0) {
      const area = turf.area(turf.bboxPolygon(bbox));

      const sizeRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Size
      );

      if (sizeRestriction && sizeRestriction.size && area > sizeRestriction.size) {
        const datasource = collectionService.getDatasource(collectionId);
        const factor = area / sizeRestriction.size;
        throw new Error(
          `Target area ${factor.toFixed(2)}x too large for instance of dataset: ${datasource?.title}.\n ${sizeRestriction.message}`
        );
      }
    }
  }

  public validateBBox(userBBox: BBox, boundaryBBox: BBox) {
    const userBBoxPolygon = turf.bboxPolygon(userBBox);
    const boundaryBBoxPolygon = turf.bboxPolygon(boundaryBBox);

    const userBBoxArea = turf.area(userBBoxPolygon);
    const boundaryBBoxArea = turf.area(boundaryBBoxPolygon);

    const intersectsBoundary = turf.booleanIntersects(userBBoxPolygon, boundaryBBoxPolygon);
    const containsBoundary = turf.booleanContains(userBBoxPolygon, boundaryBBoxPolygon);
    const smaller = userBBoxArea <= boundaryBBoxArea;

    return {
      intersectsBoundary,
      containsBoundary,
      smaller,
    };
  }

  private validateDataBoundary(bbox: BBox, collectionId: ICollection['id']) {
    const spatialSelection = this.store.getState().spatialSelection;

    const boundaryBBox =
      spatialSelection && isSpatialSelectionPredefined(spatialSelection)
        ? getBBox(spatialSelection.boundary)
        : DEFAULT_BBOX;

    const { intersectsBoundary, containsBoundary, smaller } = this.validateBBox(bbox, boundaryBBox);

    // Valid bbox should touch the AZ bbox, not contain it fully, and be smaller than the size limit
    // Certain collections have additional size restrictions due to large datasets
    // Throw errors to stop process and provide feedback to user
    this.checkCollectionBBoxRestrictions(collectionId, bbox);

    if (!intersectsBoundary) {
      throw new Error('Target area not connected to Data Boundary.');
    }
    if (containsBoundary) {
      throw new Error('Target area can not contain Data Boundary.');
    }
    if (!smaller) {
      throw new Error('Target area must be smaller than Data Boundary.');
    }
  }

  // TODO: revisit approach to errors
  public getBBox(collectionId: ICollection['id'], canThrowErrors: boolean = true): BBox {
    const drawnShapes = this.store.getState().drawnShapes;

    if (drawnShapes.length === 0) {
      if (canThrowErrors) {
        this.checkCollectionBBoxRestrictions(collectionId, DEFAULT_BBOX);
      }

      const spatialSelection = this.store.getState().spatialSelection;
      if (spatialSelection && isSpatialSelectionPredefined(spatialSelection)) {
        return getBBox(spatialSelection.boundary);
      }

      return DEFAULT_BBOX;
    }

    const featureCollection = turf.featureCollection(drawnShapes);

    const userBBox = turf.bbox(featureCollection);

    if (canThrowErrors) {
      this.validateDataBoundary(userBBox, collectionId);
    }

    return userBBox;
  }
  private filterByGeometryType<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    featureCollection: FeatureCollection<T, V>,
    filterFeatures: Feature<Polygon | MultiPolygon>[] = []
  ): FeatureCollection<T, V> {
    return {
      type: 'FeatureCollection',
      features: featureCollection.features.filter((feature) => {
        switch (feature.geometry.type) {
          case 'Point':
            return filterFeatures.some((filter) =>
              turf.booleanPointInPolygon(feature as Feature<Point>, filter)
            );

          case 'LineString':
          case 'MultiLineString':
          case 'Polygon':
          case 'MultiPolygon':
            return filterFeatures.some((filter) => turf.booleanIntersects(feature, filter));

          default:
            console.error(
              `Unexpected geometry type: ${feature.geometry?.type} in feature: `,
              feature
            );
            return false;
        }
      }),
    };
  }

  public filterLocations<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    collectionId: ICollection['id'],
    featureCollection: FeatureCollection<T, V>,
    filterFeatures: Feature<Polygon | MultiPolygon>[] = []
  ): FeatureCollection<T, V> {
    let filter = filterFeatures;
    if (filter.length === 0) {
      const bbox = this.getBBox(collectionId);
      const bboxPolygon = turf.bboxPolygon(bbox);
      filter = [bboxPolygon];
    }
    return this.filterByGeometryType(featureCollection, filter);
  }
}
