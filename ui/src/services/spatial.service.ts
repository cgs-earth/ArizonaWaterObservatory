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

  private checkCollectionBBoxRestrictions(collectionId: ICollection['id'], area: number) {
    const restrictions = CollectionRestrictions[collectionId];

    if (restrictions && restrictions.length > 0) {
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

  private validateBBox(bbox: BBox, collectionId: ICollection['id']) {
    const userBBox = turf.bboxPolygon(bbox);
    const AZBBox = turf.bboxPolygon(DEFAULT_BBOX);

    const userBBoxArea = turf.area(userBBox);
    const AZBBoxArea = turf.area(AZBBox);

    // Valid bbox should touch the AZ bbox, not contain it fully, and be smaller than the size limit
    // Certain collections have additional size restrictions due to large datasets
    // Throw errors to stop process and provide feedback to user
    this.checkCollectionBBoxRestrictions(collectionId, userBBoxArea);

    const intersectsAZ = turf.booleanIntersects(userBBox, AZBBox);
    const containsAZ = turf.booleanContains(userBBox, AZBBox);
    const smaller = userBBoxArea <= AZBBoxArea;

    if (!intersectsAZ) {
      throw new Error('Target area not connected to Arizona.');
    }
    if (containsAZ) {
      throw new Error('Target area can not contain Arizona.');
    }
    if (!smaller) {
      throw new Error('Target area must be smaller than Arizona.');
    }
  }

  // TODO: revisit approach to errors
  public getBBox(collectionId: ICollection['id'], canThrowErrors: boolean = true): BBox {
    const drawnShapes = this.store.getState().drawnShapes;

    if (drawnShapes.length === 0) {
      if (canThrowErrors) {
        this.checkCollectionBBoxRestrictions(
          collectionId,
          turf.area(turf.bboxPolygon(DEFAULT_BBOX))
        );
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
      this.validateBBox(userBBox, collectionId);
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
