/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import { ColorValueHex, Datasource, Layer, MainState } from '@/stores/main/types';

class MainController {
  private store: UseBoundStore<StoreApi<MainState>>;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
  }

  private createUUID(): string {
    return v6();
  }

  private createHexColor(): ColorValueHex {
    return '#fake';
  }

  private getCurrentDatasourceCount = (datasourceId: Datasource['id']): number => {
    return this.store.getState().layers.filter((layer) => layer.datasourceId === datasourceId)
      .length;
  };

  private getDatasource = (datasourceId: Datasource['id']): Datasource | undefined => {
    return this.store.getState().datasources.find((datasource) => datasource.id === datasourceId);
  };

  createLayer(datasourceId: Datasource['id']) {
    const datasource = this.getDatasource(datasourceId);

    if (!datasource) {
      throw new Error('Error: datasource not found');
    }

    const currentDatasourceCount = this.getCurrentDatasourceCount(datasource.id);

    const name = `${datasource.provider} ${datasource.name} ${currentDatasourceCount + 1}`;

    const layer: Layer = {
      id: this.createUUID(),
      datasourceId: datasource.id,
      name,
      color: this.createHexColor(),
      parameters: [],
      from: null,
      to: null,
      visible: true,
      locations: [],
    };

    this.store.getState().addLayer(layer);
  }
}

export default MainController;
