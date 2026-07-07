/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { BBox, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import {
  idStoreProperty,
  ItemsOnlyCollections,
  StringIdentifierCollections,
} from '@/consts/collections';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { ExtendedFeatureCollection } from '@/managers/types';
import { CollectionService } from '@/services/collection.service';
import { CoverageGeoService } from '@/services/coverageJSON/coverageGeo.service';
import { EDRService, ICollection } from '@/services/edr.service';
import { CollectionType, getCollectionType } from '@/utils/collection';

type FetchServiceDependencies = {
  awoService: EDRService;
  collectionService: CollectionService;
};

export class FetchService {
  private deps: FetchServiceDependencies;

  constructor(deps: FetchServiceDependencies) {
    this.deps = deps;
  }

  public async fetchData<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    collectionId: ICollection['id'],
    bbox?: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal,
    next?: string
  ): Promise<FeatureCollection<T, V>> {
    const collection = this.deps.collectionService.getDatasource(collectionId);

    if (!collection) {
      throw new Error('Datasource not found');
    }

    const collectionType = getCollectionType(collection);

    switch (collectionType) {
      case CollectionType.EDR:
        if (ItemsOnlyCollections.includes(collectionId)) {
          return await this.fetchItems(collectionId, parameterNames, bbox, signal, next);
        }
        return await this.fetchLocations(collectionId, parameterNames, bbox, signal, next);
      case CollectionType.Features:
        return await this.fetchItems(collectionId, parameterNames, bbox, signal, next);
      case CollectionType.EDRGrid:
        if (!bbox) {
          throw new Error('No BBox provided for Grid layer');
        }
        // TODO: improve typing here
        return (await this.fetchGrid(
          collectionId,
          bbox,
          from,
          to,
          parameterNames,
          signal
        )) as FeatureCollection<T, V>;
    }

    throw new Error('Unsupported collection type');
  }

  /**
   *
   * @function
   */
  private async fetchLocations<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    collectionId: ICollection['id'],
    parameterNames?: string[],
    bbox?: BBox,
    signal?: AbortSignal,
    next?: string
  ): Promise<FeatureCollection<T, V>> {
    const data = await this.deps.awoService.getLocations<FeatureCollection<T, V>>(
      collectionId,
      {
        signal,
        params: {
          limit: 2000,
          bbox,
          ...(parameterNames && parameterNames.length > 0
            ? { 'parameter-name': parameterNames.join(',') }
            : {}),
        },
      },
      next
    );

    if (!data) {
      return getDefaultGeoJSON<T, V>();
    }

    if (StringIdentifierCollections.includes(collectionId)) {
      return this.storeIdentifiers(data);
    }

    return data;
  }

  /**
   *
   * @function
   */
  private storeIdentifiers<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(featureCollection: ExtendedFeatureCollection<T, V>): ExtendedFeatureCollection<T, V> {
    return {
      ...featureCollection,
      features: featureCollection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          [idStoreProperty]: String(feature.id),
        },
      })),
    };
  }

  /**
   *
   * @function
   */
  private async fetchItems<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    collectionId: ICollection['id'],
    parameterNames?: string[],
    bbox?: BBox,
    signal?: AbortSignal,
    next?: string
  ): Promise<ExtendedFeatureCollection<T, V>> {
    const data = await this.deps.awoService.getItems<ExtendedFeatureCollection<T, V>>(
      collectionId,
      {
        signal,
        params: {
          limit: 2000,
          bbox,
          ...(parameterNames && parameterNames.length > 0
            ? { 'parameter-name': parameterNames.join(',') }
            : {}),
        },
      },
      next
    );

    if (!data) {
      return getDefaultGeoJSON<T, V>();
    }

    if (StringIdentifierCollections.includes(collectionId)) {
      return this.storeIdentifiers<T, V>(data);
    }

    return data;
  }

  /**
   *
   * @function
   */
  private async fetchGrid(
    collectionId: ICollection['id'],
    bbox: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection> {
    return await new CoverageGeoService().createGrid(
      collectionId,
      bbox,
      from,
      to,
      parameterNames,
      signal
    );
  }
}
