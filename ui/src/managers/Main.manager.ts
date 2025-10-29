/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import { GeoJSONFeature, GeoJSONSource, Map, Popup } from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import { Config, GetConfigResponse, PostConfigResponse } from '@/managers/types';
import { ICollection } from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { ColorValueHex, Layer, Location, MainState } from '@/stores/main/types';
import { getRandomHexColor } from '@/utils/hexColor';
import {
  getFillLayerDefinition,
  getLineLayerDefinition,
  getPointLayerDefinition,
} from '@/utils/layerDefinitions';
import { getProvider } from '@/utils/provider';

class MainManager {
  private store: UseBoundStore<StoreApi<MainState>>;
  private map: Map | null = null;
  private hoverPopup: Popup | null = null;
  private draw: MapboxDraw | null = null;

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

  /**
   *
   * @function
   */
  public setDraw(draw: MapboxDraw): void {
    if (!this.draw) {
      this.draw = draw;
    }
  }

  private createUUID(): string {
    return v6();
  }

  private createHexColor(): ColorValueHex {
    return getRandomHexColor();
  }

  private compareArrays<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const sorted1 = [...a].sort();
    const sorted2 = [...b].sort();

    return sorted1.every((val, index) => val === sorted2[index]);
  }

  public isValidConfig(config: Config | undefined): { valid: boolean; reasons: string[] } {
    if (!config) {
      return {
        valid: false,
        reasons: ['No config provided.'],
      };
    }

    const reasons: string[] = [];
    if (!config.provider && !config.category && !config.collection && config.layers.length === 0) {
      reasons.push('No provider, category, collection, or layers selected.');
    }
    if (!config.center) {
      reasons.push('Missing map center.');
    }
    if (typeof config.zoom !== 'number') {
      reasons.push('Zoom is not a number.');
    }
    if (typeof config.bearing !== 'number') {
      reasons.push('Bearing is not a number.');
    }
    if (typeof config.pitch !== 'number') {
      reasons.push('Pitch is not a number.');
    }

    return { valid: reasons.length === 0, reasons };
  }

  private generateConfig(): Config | undefined {
    if (!this.map) {
      return;
    }

    const layers = this.store.getState().layers;
    const provider = this.store.getState().provider;
    const category = this.store.getState().category;
    const collection = this.store.getState().collection;
    const charts = this.store.getState().charts;
    const locations = this.store.getState().locations;
    const drawnShapes = this.store.getState().drawnShapes;
    const basemap = this.store.getState().basemap;

    const bounds = this.map.getBounds();
    const zoom = this.map.getZoom();
    const center = this.map.getCenter();
    const bearing = this.map.getBearing();
    const pitch = this.map.getPitch();

    return {
      layers,
      provider,
      category,
      collection,
      charts,
      locations,
      drawnShapes,
      basemap,
      bounds,
      zoom,
      center,
      bearing,
      pitch,
    };
  }

  private getShareId(jobId: string): string | undefined {
    const uuid = jobId.split('/').pop();
    return uuid;
  }

  public async saveConfig(signal?: AbortSignal): Promise<PostConfigResponse> {
    const config = this.generateConfig();

    const validate = this.isValidConfig(config);
    if (!validate.valid) {
      return {
        success: false,
        response: validate.reasons, // TODO: More robust response
      };
    }

    const url = `${import.meta.env.VITE_AWO_CONFIG_SOURCE}/processes/config-store/execution?f=json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: config }),
      signal,
    });

    if (response.ok) {
      const jobId = response.headers.get('location');
      const shareId = this.getShareId(jobId ?? '');
      if (shareId) {
        return {
          success: true,
          response: [shareId],
        };
      }
      return {
        success: false,
        response: [`Issue extracting shareId, original URL: ${jobId}`], // TODO: refine
      };
    }
    return {
      success: false,
      response: ['Config generation unsuccessful'], // TODO: refine
    };
  }

  public async getConfig(shareId: string, signal?: AbortSignal): Promise<GetConfigResponse> {
    const url = `${import.meta.env.VITE_AWO_CONFIG_SOURCE}/jobs/${shareId}/results?f=json`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    });

    if (response.ok) {
      const config = (await response.json()) as Config;

      return {
        success: true,
        response: config,
      };
    }

    return {
      success: false,
      response:
        response.statusText.length > 0
          ? response.statusText
          : 'Unknown error encountered. Please provide this url to site maintainer.', // TODO: refine
    };
  }

  public async loadConfig(config: Config): Promise<boolean> {
    if (!this.map || !this.draw || !this.isValidConfig(config).valid) {
      return false;
    }

    this.store.getState().setLayers(config.layers);
    this.store.getState().setProvider(config.provider);
    this.store.getState().setCategory(config.category);
    this.store.getState().setCollection(config.collection);
    this.store.getState().setCharts(config.charts);
    this.store.getState().setDrawnShapes(config.drawnShapes);
    this.store.getState().setBasemap(config.basemap);

    for (const shape of config.drawnShapes) {
      this.draw.add(shape);
    }

    this.map.setZoom(config.zoom);
    this.map.setCenter(config.center);
    this.map.setBearing(config.bearing);
    this.map.setPitch(config.pitch);

    await this.applySpatialFilter(config.drawnShapes);
    for (const layer of config.layers) {
      const sourceId = this.getSourceId(layer.datasourceId);
      this.addLocationLayer(layer, sourceId);
    }

    // Set locations after loading layer to reflect selected state in map
    this.store.getState().setLocations(config.locations);

    return true;
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
  private async fetchLocations(
    collectionId: ICollection['id'],
    signal?: AbortSignal,
    parameterNames?: string[]
  ): Promise<FeatureCollection<Point>> {
    return awoService.getLocations<FeatureCollection<Point>>(collectionId, {
      signal,
      params: {
        ...(parameterNames && parameterNames.length > 0
          ? { 'parameter-name': parameterNames.join(',') }
          : {}),
      },
    });
  }

  /**
   *
   * @function
   */
  public getDatasourceCount = (datasourceId: ICollection['id']): number => {
    return this.store.getState().layers.filter((layer) => layer.datasourceId === datasourceId)
      .length;
  };

  public getDatasource = (datasourceId: ICollection['id']): ICollection | undefined => {
    return this.store
      .getState()
      .originalCollections.find((datasource) => datasource.id === datasourceId);
  };

  public getLayer = (layerId: Layer['id']): Layer | undefined => {
    return this.store.getState().layers.find((layer) => layer.id === layerId);
  };

  public async createLayer(datasourceId: ICollection['id'], signal?: AbortSignal) {
    const datasource = this.getDatasource(datasourceId);

    if (!datasource) {
      throw new Error('Error: datasource not found');
    }

    const currentDatasourceCount = this.getDatasourceCount(datasource.id);
    const layers = this.store.getState().layers;

    const provider = getProvider(datasource.id);

    const title = datasource.title ?? datasource.id;

    let next = 1;
    let name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    while (layers.some((layer) => layer.name === name)) {
      name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    }

    const today = dayjs();
    const oneWeekAgo = today.subtract(1, 'week');

    const layer: Layer = {
      id: this.createUUID(),
      datasourceId: datasource.id,
      name,
      color: this.createHexColor(),
      parameters: [],
      from: oneWeekAgo.format('YYYY-MM-DD'),
      to: today.format('YYYY-MM-DD'),
      visible: true,
      locations: [],
    };

    const drawnShapes = this.store.getState().drawnShapes;

    const sourceId = await this.addLocationSource(datasource.id, layer.id, {
      filterFeatures: drawnShapes,
      signal,
    });
    this.addLocationLayer(layer, sourceId);

    this.store.getState().addLayer(layer);
  }

  public deleteLayer(layer: Layer) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layer.id);
    const layers = this.store.getState().layers.filter((_layer) => _layer.id !== layer.id);

    if (this.map) {
      const { pointLayerId, fillLayerId, lineLayerId } = this.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      if (this.map.getLayer(pointLayerId)) {
        this.map.removeLayer(pointLayerId);
      }
      if (this.map.getLayer(fillLayerId)) {
        this.map.removeLayer(fillLayerId);
      }
      if (this.map.getLayer(lineLayerId)) {
        this.map.removeLayer(lineLayerId);
      }
    }

    this.store.getState().setCharts(charts);
    this.store.getState().setLayers(layers);
  }

  /**
   *
   * @function
   */
  public getSourceId(collectionId: ICollection['id']): string {
    return `user-${collectionId}-source`;
  }

  /**
   *
   * @function
   */
  public getLocationsLayerIds(
    collectionId: ICollection['id'],
    layerId: Layer['id']
  ): {
    pointLayerId: string;
    fillLayerId: string;
    lineLayerId: string;
  } {
    return {
      pointLayerId: `user-${collectionId}-${layerId}-edr-locations-point`,
      fillLayerId: `user-${collectionId}-${layerId}-edr-locations-fill`,
      lineLayerId: `user-${collectionId}-${layerId}-edr-locations-line`,
    };
  }

  public getFilterLayerId(collectionId: ICollection['id']): string {
    return `${collectionId}-filter`;
  }

  private filterByGeometryType(
    featureCollection: FeatureCollection<Geometry>,
    filterFeatures: Feature<Polygon | MultiPolygon>[] = []
  ): FeatureCollection<Geometry> {
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

  private clearInvalidLocations = (
    layerId: Layer['id'],
    featureCollection: FeatureCollection<Geometry>
  ) => {
    const { locations, removeLocation } = this.store.getState();

    const layerLocations = locations.filter((location) => location.layerId === layerId);

    const validIds = new Set(featureCollection.features.map((feature) => String(feature.id)));
    const invalidLocations = layerLocations.filter((location) => !validIds.has(location.id));

    if (invalidLocations.length === 0) {
      return;
    }

    invalidLocations.forEach((location) => removeLocation(location));
  };

  private filterLocations(
    featureCollection: FeatureCollection<Geometry>,
    filterFeatures: Feature<Polygon | MultiPolygon>[] = []
  ): FeatureCollection<Geometry> {
    if (filterFeatures.length > 0) {
      return this.filterByGeometryType(featureCollection, filterFeatures);
    }

    return featureCollection;
  }

  /**
   *
   * @function
   */
  private async addLocationSource(
    collectionId: ICollection['id'],
    layerId: Layer['id'],
    options?: {
      filterFeatures?: Feature<Polygon | MultiPolygon>[];
      signal?: AbortSignal;
      parameterNames?: string[];
    }
  ): Promise<string> {
    const sourceId = this.getSourceId(collectionId);
    if (this.map) {
      const source = this.map.getSource(sourceId) as GeoJSONSource;
      if (!source) {
        const data = await this.fetchLocations(
          collectionId,
          options?.signal,
          options?.parameterNames
        );

        const filteredData = this.filterLocations(data, options?.filterFeatures);

        this.clearInvalidLocations(layerId, filteredData);

        this.map.addSource(sourceId, {
          type: 'geojson',
          data: filteredData,
        });
      } else if (source) {
        const data = await this.fetchLocations(
          collectionId,
          options?.signal,
          options?.parameterNames
        );

        const filteredData = this.filterLocations(data, options?.filterFeatures);

        this.clearInvalidLocations(layerId, filteredData);

        source.setData(filteredData);
      }
    }

    return sourceId;
  }

  private getUniqueIds(features: GeoJSONFeature[]): Array<string> {
    const uniques = new Set<string>();

    for (const feature of features) {
      if (feature.id) {
        uniques.add(String(feature.id));
      }
    }

    return Array.from(uniques).sort();
  }

  /**
   *
   * @function
   */
  private async addLocationLayer(layer: Layer, sourceId: string): Promise<void> {
    const geographyFilter = this.store.getState().geographyFilter;

    const { pointLayerId, fillLayerId, lineLayerId } = this.getLocationsLayerIds(
      layer.datasourceId,
      layer.id
    );
    if (this.map) {
      if (
        !this.map.getLayer(pointLayerId) &&
        !this.map.getLayer(lineLayerId) &&
        !this.map.getLayer(pointLayerId)
      ) {
        this.map.addLayer(getFillLayerDefinition(fillLayerId, sourceId, layer.color));
        this.map.addLayer(getLineLayerDefinition(lineLayerId, sourceId, layer.color));
        this.map.addLayer(getPointLayerDefinition(pointLayerId, sourceId, layer.color));

        this.map.on('click', pointLayerId, (e) => {
          e.originalEvent.preventDefault();

          const features = this.map!.queryRenderedFeatures(e.point, {
            layers: [pointLayerId],
          });
          if (features.length > 0) {
            const uniqueFeatures = this.getUniqueIds(features);
            uniqueFeatures.forEach((locationId) => {
              if (this.hasLocation(locationId)) {
                this.store.getState().removeLocation({
                  id: locationId,
                  layerId: layer.id,
                });
              } else {
                this.store.getState().addLocation({
                  id: locationId,
                  layerId: layer.id,
                });
              }
            });
          }
        });

        this.map.on('click', fillLayerId, (e) => {
          if (!e.originalEvent.defaultPrevented) {
            e.originalEvent.preventDefault();

            const features = this.map!.queryRenderedFeatures(e.point, {
              layers: [fillLayerId],
            });
            if (features.length > 0) {
              const uniqueFeatures = this.getUniqueIds(features);
              uniqueFeatures.forEach((locationId) => {
                if (this.hasLocation(locationId)) {
                  this.store.getState().removeLocation({
                    id: locationId,
                    layerId: layer.id,
                  });
                } else {
                  this.store.getState().addLocation({
                    id: locationId,
                    layerId: layer.id,
                  });
                }
              });
            }
          }
        });

        this.map.on('click', lineLayerId, (e) => {
          if (!e.originalEvent.defaultPrevented) {
            e.originalEvent.preventDefault();

            const features = this.map!.queryRenderedFeatures(e.point, {
              layers: [lineLayerId],
            });
            if (features.length > 0) {
              const uniqueFeatures = this.getUniqueIds(features);
              uniqueFeatures.forEach((locationId) => {
                if (this.hasLocation(locationId)) {
                  this.store.getState().removeLocation({
                    id: locationId,
                    layerId: layer.id,
                  });
                } else {
                  this.store.getState().addLocation({
                    id: locationId,
                    layerId: layer.id,
                  });
                }
              });
            }
          }
        });

        this.map.on('mouseenter', [pointLayerId, fillLayerId, lineLayerId], (e) => {
          this.map!.getCanvas().style.cursor = 'pointer';
          const { features } = e;
          if (features && features.length > 0) {
            const uniqueFeatures = this.getUniqueIds(features);
            if (layer) {
              const html = `
                <span style="color:black;">
                  <strong>${layer.name}</strong><br/>
                  ${uniqueFeatures.map((locationId) => `<strong>Location Id: </strong>${locationId}`).join('<br/>')}
                  <div style="margin-top: 16px;display:flex;flex-direction:column;justify-content:center;align-items:center">
                    <p style="margin: 0;">Click to select the location.</p>
                    <p style="margin: 0;">Double-click to preview.</p>
                  </div>
                </span>
              `;
              this.hoverPopup!.setLngLat(e.lngLat).setHTML(html).addTo(this.map!);
            }
          }
        });
        this.map.on('mousemove', [pointLayerId, fillLayerId, lineLayerId], (e) => {
          this.map!.getCanvas().style.cursor = 'pointer';
          const { features } = e;
          if (features && features.length > 0) {
            const uniqueFeatures = this.getUniqueIds(features);
            if (layer) {
              const html = `
                <span style="color:black;">
                  <strong>${layer.name}</strong><br/>
                  ${uniqueFeatures.map((locationId) => `<strong>Location Id: </strong>${locationId}`).join('<br/>')}
                  <div style="margin-top: 16px;display:flex;flex-direction:column;justify-content:center;align-items:center">
                    <p style="margin: 0;">Click to select the location.</p>
                    <p style="margin: 0;">Double-click to preview.</p>
                  </div>
                </span>
              `;
              this.hoverPopup!.setLngLat(e.lngLat).setHTML(html).addTo(this.map!);
            }
          }
        });
        this.map.on('mouseleave', [pointLayerId, fillLayerId, lineLayerId], () => {
          this.map!.getCanvas().style.cursor = '';
          this.hoverPopup!.remove();
        });
      }
      if (geographyFilter) {
        const geoFilterLayerId = this.getFilterLayerId(geographyFilter.collectionId);
        [fillLayerId, lineLayerId, pointLayerId].forEach((layerId) =>
          this.map!.moveLayer(geoFilterLayerId, layerId)
        );
      }
    }
  }

  /**
   *
   * @function
   */
  public async getData(layer: Layer, signal: AbortSignal): Promise<FeatureCollection> {
    try {
      const sourceId = this.getSourceId(layer.datasourceId);

      const source = this.map?.getSource(sourceId) as GeoJSONSource;

      const data = source._data;
      if (typeof data !== 'string') {
        const featureCollection = turf.featureCollection(
          (data as FeatureCollection).features as Feature[]
        );

        return featureCollection;
      }
    } catch (error) {
      console.error(error);
    }

    const drawnShapes = this.store.getState().drawnShapes;

    const data = await this.fetchLocations(layer.datasourceId, signal, layer.parameters);

    const filteredData = this.filterLocations(data, drawnShapes);

    return filteredData;
  }
  // public async getLocations(): Promise<void> {
  //   // Specific user collection choice
  //   const collection = this.store.getState().collection;
  //   // All collections for selected filters
  //   const collections = this.store.getState().collections;

  //   if (collection) {
  //     const sourceId = await this.addLocationSource(collection);
  //     this.addLocationLayer(collection, sourceId);
  //   } else {
  //     const chunkSize = 5;

  //     for (let i = 0; i < collections.length; i += chunkSize) {
  //       const chunk = collections.slice(i, i + chunkSize);

  //       await Promise.all(
  //         chunk.map(async (collection) => {
  //           const collectionId = collection.id;
  //           const sourceId = await this.addLocationSource(collectionId);
  //           this.addLocationLayer(collectionId, sourceId);
  //         })
  //       );
  //     }
  //   }
  // }

  public async applySpatialFilter(drawnShapes: Feature<Polygon | MultiPolygon>[]): Promise<void> {
    const layers = this.store.getState().layers;

    const chunkSize = 5;

    for (let i = 0; i < layers.length; i += chunkSize) {
      const chunk = layers.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (layer) => {
          const collectionId = layer.datasourceId;
          return await this.addLocationSource(collectionId, layer.id, {
            filterFeatures: drawnShapes,
          });
        })
      );
    }
  }

  public async updateLayer(
    layer: Layer,
    name: Layer['name'],
    color: Layer['color'],
    parameters: Layer['parameters'],
    from: Layer['from'],
    to: Layer['to']
  ): Promise<void> {
    if (color !== layer.color) {
      if (this.map) {
        const { pointLayerId, fillLayerId, lineLayerId } = this.getLocationsLayerIds(
          layer.datasourceId,
          layer.id
        );
        if (this.map.getLayer(pointLayerId)) {
          this.map.setPaintProperty(pointLayerId, 'circle-color', color);
        }
        if (this.map.getLayer(fillLayerId)) {
          this.map.setPaintProperty(fillLayerId, 'fill-color', color);
        }
        if (this.map.getLayer(lineLayerId)) {
          this.map.setPaintProperty(lineLayerId, 'line-color', color);
        }
      }
    }

    if (!this.compareArrays(layer.parameters, parameters)) {
      const drawnShapes = this.store.getState().drawnShapes;
      await this.addLocationSource(layer.datasourceId, layer.id, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
      });
    }

    this.store.getState().updateLayer({
      ...layer,
      name,
      color,
      parameters,
      from,
      to,
    });
  }

  /**
   *
   * @function
   */
  public async getCollections(): Promise<void> {
    const provider = this.store.getState().provider;
    const category = this.store.getState().category;

    const response = await awoService.getCollections({
      params: {
        ...(provider ? { 'provider-name': provider } : {}),
        'parameter-name': category ? category.value : '*',
      },
    });
    const originalCollections = this.store.getState().originalCollections;
    if (originalCollections.length === 0) {
      this.store.getState().setOriginalCollections(response.collections);
    }

    this.store.getState().setCollections(response.collections);
  }

  private clearLocationLayers(): void {
    if (!this.map) {
      return;
    }

    const layers = this.store.getState().layers;

    for (const layer of layers) {
      const layerIds = Object.values(this.getLocationsLayerIds(layer.datasourceId, layer.id));
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }
    }
  }

  private clearLocationSources(): void {
    if (!this.map) {
      return;
    }

    const originalCollections = this.store.getState().originalCollections;

    for (const collection of originalCollections) {
      const sourceId = this.getSourceId(collection.id);
      if (this.map.getSource(sourceId)) {
        this.map.removeSource(sourceId);
      }
    }
  }

  public clearAllData(): void {
    this.store.getState().setLocations([]);

    this.clearLocationLayers();
    this.clearLocationSources();

    this.store.getState().setProvider(null);
    this.store.getState().setCategory(null);
    this.store.getState().setCollection(null);
  }
}

export default MainManager;
