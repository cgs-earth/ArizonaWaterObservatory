/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoreApi, UseBoundStore } from 'zustand';
import { ICollection } from '@/services/edr.service';
import { Layer, Location, MainState } from '@/stores/main/types';

export class CollectionService {
  private store: UseBoundStore<StoreApi<MainState>>;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
  }

  /**
   *
   * @function
   */
  public hasCollection(collectionId: ICollection['id']): boolean {
    return this.store.getState().hasCollection(collectionId);
  }

  /**
   *
   * @function
   */
  public hasLocation(locationId: Location['id']): boolean {
    return this.store.getState().hasLocation(locationId);
  }

  /**
   *
   * @function
   */
  public getDatasourceCount(datasourceId: ICollection['id']): number {
    return this.store.getState().layers.filter((layer) => layer.datasourceId === datasourceId)
      .length;
  }

  public getDatasource(datasourceId: ICollection['id']): ICollection | undefined {
    return this.store
      .getState()
      .originalCollections.find((datasource) => datasource.id === datasourceId);
  }

  public getLayer(layerId: Layer['id']): Layer | undefined {
    return this.store.getState().layers.find((layer) => layer.id === layerId);
  }
}
