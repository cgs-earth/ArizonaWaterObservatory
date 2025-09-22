/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Map, Popup } from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import { ColorValueHex, Datasource, Layer, MainState } from '@/stores/main/types';

class MainManager {
  private store: UseBoundStore<StoreApi<MainState>>;
  private map: Map | null = null;
  private hoverPopup: Popup | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
  }

  /**
   *
   * @function
   */
  public setMap(map: Map): void {
    if (!this.map) {
      this.map = map;
    }
  }

  /**
   *
   * @function
   */
  public setPopup(popup: Popup): void {
    if (!this.hoverPopup) {
      this.hoverPopup = popup;
    }
  }

  private createUUID(): string {
    return v6();
  }

  private createHexColor(): ColorValueHex {
    return '#fake';
  }

  getDatasourceCount = (datasourceId: Datasource['id']): number => {
    return this.store.getState().layers.filter((layer) => layer.datasourceId === datasourceId)
      .length;
  };

  getDatasource = (datasourceId: Datasource['id']): Datasource | undefined => {
    return this.store.getState().collections.find((datasource) => datasource.id === datasourceId);
  };

  createLayer(datasourceId: Datasource['id']) {
    const datasource = this.getDatasource(datasourceId);

    if (!datasource) {
      throw new Error('Error: datasource not found');
    }

    const currentDatasourceCount = this.getDatasourceCount(datasource.id);
    const layers = this.store.getState().layers;

    let next = 1;
    let name = `${datasource.provider} ${datasource.name} ${currentDatasourceCount + next++}`;
    while (layers.some((layer) => layer.name === name)) {
      name = `${datasource.provider} ${datasource.name} ${currentDatasourceCount + next++}`;
    }

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

  deleteLayer(layerId: Layer['id']) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layerId);
    const layers = this.store.getState().layers.filter((layer) => layer.id !== layerId);

    this.store.getState().setCharts(charts);
    this.store.getState().setLayers(layers);
  }
}

export default MainManager;
