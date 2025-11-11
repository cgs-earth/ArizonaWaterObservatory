/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { BBox, Feature, FeatureCollection, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import { GeoJSONFeature, GeoJSONSource, Map, Popup, RasterTileSource } from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { DEFAULT_BBOX, DEFAULT_FILL_OPACITY, DEFAULT_RASTER_OPACITY } from '@/features/Map/consts';
import { Config, GetConfigResponse, PostConfigResponse, SourceOptions } from '@/managers/types';
import { CoverageGridService } from '@/services/coverageGrid.service';
import { ICollection, ParameterGroup } from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import {
  ColorValueHex,
  Layer,
  Location,
  MainState,
  ParameterGroupMembers,
} from '@/stores/main/types';
import { CollectionType, getCollectionType, isEdrGrid } from '@/utils/collection';
import { getRandomHexColor } from '@/utils/hexColor';
import {
  getFillLayerDefinition,
  getLineLayerDefinition,
  getPointLayerDefinition,
  getRasterLayerSpecification,
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
      this.addLayer(layer, sourceId);
    }

    // Set locations after loading layer to reflect selected state in map
    this.store.getState().setLocations(config.locations);

    return true;
  }

  public getUniqueIds(features: GeoJSONFeature[]): Array<string> {
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

  private async fetchData(
    collectionId: ICollection['id'],
    bbox?: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection> {
    const collection = this.getDatasource(collectionId);

    if (!collection) {
      throw new Error('Datasource not found');
    }

    const collectionType = getCollectionType(collection);

    switch (collectionType) {
      case CollectionType.EDR:
        return await this.fetchLocations(collectionId, parameterNames, signal);
      case CollectionType.Features:
        return await this.fetchItems(collectionId, parameterNames, signal);
      case CollectionType.EDRGrid:
        if (!bbox) {
          throw new Error('No BBox provided for Grid layer');
        }
        return await this.fetchGrid(collectionId, bbox, from, to, parameterNames, signal);
    }

    throw new Error('Unsupported collection type');
  }
  /**
   *
   * @function
   */
  private async fetchLocations(
    collectionId: ICollection['id'],
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection> {
    return await awoService.getLocations<FeatureCollection>(collectionId, {
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
  private async fetchItems(
    collectionId: ICollection['id'],
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection> {
    return await awoService.getItems<FeatureCollection>(collectionId, {
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
  private async fetchGrid(
    collectionId: ICollection['id'],
    bbox: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal
  ): Promise<FeatureCollection> {
    return await new CoverageGridService().createGrid(
      collectionId,
      bbox,
      from,
      to,
      parameterNames,
      signal
    );
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

    const collectionType = getCollectionType(datasource);
    const title = datasource.title ?? datasource.id;

    let next = 1;
    let name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    while (layers.some((layer) => layer.name === name)) {
      name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    }

    const to = dayjs();
    const from =
      collectionType === CollectionType.EDRGrid ? to.subtract(1, 'year') : to.subtract(1, 'week');

    const layer: Layer = {
      id: this.createUUID(),
      datasourceId: datasource.id,
      name,
      color: this.createHexColor(),
      parameters: [],
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
      visible: true,
      locations: [],
      opacity:
        collectionType === CollectionType.Map ? DEFAULT_RASTER_OPACITY : DEFAULT_FILL_OPACITY,
      position: layers.length + 1,
    };

    const drawnShapes = this.store.getState().drawnShapes;

    const sourceId = await this.addSource(datasource.id, layer, {
      filterFeatures: drawnShapes,
      signal,
      noFetch: collectionType === CollectionType.EDRGrid,
    });
    this.addLayer(layer, sourceId);

    this.store.getState().addLayer(layer);
  }

  public deleteLayer(layer: Layer) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layer.id);
    const layers = this.store.getState().layers.filter((_layer) => _layer.id !== layer.id);

    if (this.map) {
      const layerIds = Object.values(this.getLocationsLayerIds(layer.datasourceId, layer.id));
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }
    }

    this.store.getState().setCharts(charts);
    this.store.getState().setLayers(layers);
  }

  public reorderLayers() {
    if (!this.map) {
      return;
    }

    const layers = [...this.store.getState().layers].sort((a, b) => a.position - b.position);
    let lastLayer = '';
    for (const layer of layers) {
      const { rasterLayerId, fillLayerId, lineLayerId, pointLayerId } = this.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );
      // Intentional ordering of sub-layers
      for (const layerId of [rasterLayerId, fillLayerId, lineLayerId, pointLayerId]) {
        if (this.map.getLayer(layerId)) {
          if (lastLayer.length > 0) {
            this.map.moveLayer(layerId, lastLayer);
          }
          lastLayer = layerId;
        }
      }
    }
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
    rasterLayerId: string;
  } {
    return {
      pointLayerId: `user-${collectionId}-${layerId}-point`,
      fillLayerId: `user-${collectionId}-${layerId}-fill`,
      lineLayerId: `user-${collectionId}-${layerId}-line`,
      rasterLayerId: `user-${collectionId}-${layerId}-raster`,
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
    collectionId: ICollection['id'],
    featureCollection: FeatureCollection<Geometry>
  ) => {
    const datasource = this.getDatasource(collectionId);

    if (datasource && isEdrGrid(datasource)) {
      this.store.getState().setLocations([]);
    } else {
      const { locations, removeLocation } = this.store.getState();

      const layerLocations = locations.filter((location) => location.layerId === layerId);

      const validIds = new Set(featureCollection.features.map((feature) => String(feature.id)));
      const invalidLocations = layerLocations.filter((location) => !validIds.has(location.id));

      if (invalidLocations.length === 0) {
        return;
      }

      invalidLocations.forEach((location) => removeLocation(location));
    }
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

  private getBBox(): BBox {
    const drawnShapes = this.store.getState().drawnShapes;

    if (drawnShapes.length === 0) {
      return DEFAULT_BBOX;
    }

    const featureCollection = turf.featureCollection(drawnShapes);

    return turf.bbox(featureCollection);
  }

  private async addSource(collectionId: ICollection['id'], layer: Layer, options?: SourceOptions) {
    const datasource = this.getDatasource(collectionId);
    const sourceId = this.getSourceId(collectionId);

    if (datasource) {
      const collectionType = getCollectionType(datasource);

      if (
        [CollectionType.EDR, CollectionType.Features, CollectionType.EDRGrid].includes(
          collectionType
        )
      ) {
        await this.addGeoJsonSource(collectionId, layer, options);
      } else if (collectionType === CollectionType.Map) {
        this.addRasterSource(datasource);
      }
    }

    return sourceId;
  }

  /**
   *
   * @function
   */
  private async addGeoJsonSource(
    collectionId: ICollection['id'],
    layer: Layer,
    options?: SourceOptions
  ): Promise<string> {
    const sourceId = this.getSourceId(collectionId);
    if (this.map) {
      const source = this.map.getSource(sourceId) as GeoJSONSource;
      const bbox = this.getBBox();
      if (!source) {
        if (options?.noFetch) {
          this.map.addSource(sourceId, {
            type: 'geojson',
            data: getDefaultGeoJSON(),
          });

          return sourceId;
        }

        const data = await this.fetchData(
          collectionId,
          bbox,
          options?.from ?? layer.from,
          options?.to ?? layer.to,
          options?.parameterNames,
          options?.signal
        );

        const filteredData = this.filterLocations(data, options?.filterFeatures);

        this.clearInvalidLocations(layer.id, collectionId, filteredData);

        this.map.addSource(sourceId, {
          type: 'geojson',
          data: filteredData,
        });
      } else if (source && !options?.noFetch) {
        const data = await this.fetchData(
          collectionId,
          bbox,
          options?.from ?? layer.from,
          options?.to ?? layer.to,
          options?.parameterNames,
          options?.signal
        );

        const filteredData = this.filterLocations(data, options?.filterFeatures);

        this.clearInvalidLocations(layer.id, collectionId, filteredData);

        source.setData(filteredData);
      }
    }

    return sourceId;
  }

  private addRasterSource(collection: ICollection) {
    const link = collection.links.find(
      (link) => link.rel.includes('map') && link.type === 'image/png'
    );
    const sourceId = this.getSourceId(collection.id);
    if (link && this.map) {
      const source = this.map.getSource(sourceId) as RasterTileSource;

      if (!source) {
        this.map.addSource(sourceId, {
          type: 'raster',
          bounds: DEFAULT_BBOX,
          tiles: [
            `${link.href}&bbox-crs=http://www.opengis.net/def/crs/EPSG/0/3857&bbox={bbox-epsg-3857}`,
          ],
          tileSize: 256,
          minzoom: 4,
        });
      }
    }
  }
  private addLayer(layer: Layer, sourceId: string): void {
    const datasource = this.getDatasource(layer.datasourceId);

    if (datasource) {
      const collectionType = getCollectionType(datasource);

      if (
        [CollectionType.EDR, CollectionType.Features, CollectionType.EDRGrid].includes(
          collectionType
        )
      ) {
        this.addStandardLayer(layer, sourceId);
      } else if (collectionType === CollectionType.Map) {
        this.addRasterLayer(layer, sourceId);
      }
    }
  }

  private addRasterLayer(layer: Layer, sourceId: string): void {
    const { rasterLayerId } = this.getLocationsLayerIds(layer.datasourceId, layer.id);

    if (this.map && !this.map.getLayer(rasterLayerId)) {
      this.map.addLayer(getRasterLayerSpecification(rasterLayerId, sourceId));
    }
  }

  /**
   *
   * @function
   */
  private addStandardLayer(layer: Layer, sourceId: string): void {
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
  public async getFeatures(layer: Layer, signal: AbortSignal): Promise<FeatureCollection> {
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

    const bbox = this.getBBox();

    const data = await this.fetchData(
      layer.datasourceId,
      bbox,
      layer.from,
      layer.to,
      layer.parameters,
      signal
    );

    const drawnShapes = this.store.getState().drawnShapes;
    const filteredData = this.filterLocations(data, drawnShapes);

    return filteredData;
  }

  public async applySpatialFilter(drawnShapes: Feature<Polygon | MultiPolygon>[]): Promise<void> {
    const layers = this.store.getState().layers;

    const chunkSize = 5;

    for (let i = 0; i < layers.length; i += chunkSize) {
      const chunk = layers.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (layer) => {
          const collectionId = layer.datasourceId;
          return await this.addSource(collectionId, layer, {
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
    to: Layer['to'],
    visible: Layer['visible'],
    opacity: Layer['opacity']
  ): Promise<void> {
    const layerIds = this.getLocationsLayerIds(layer.datasourceId, layer.id);

    if (color !== layer.color) {
      if (this.map) {
        const { pointLayerId, fillLayerId, lineLayerId } = layerIds;
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

    if (visible !== layer.visible) {
      if (this.map) {
        for (const layerId of Object.values(layerIds)) {
          if (this.map.getLayer(layerId)) {
            this.map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
          }
        }
      }
    }

    if (opacity !== layer.opacity) {
      if (this.map) {
        const { fillLayerId, rasterLayerId } = layerIds;
        // TODO: readd if meaningful
        // if (this.map.getLayer(pointLayerId)) {
        //   this.map.setPaintProperty(pointLayerId, 'circle-opacity', opacity);
        // }
        if (this.map.getLayer(fillLayerId)) {
          this.map.setPaintProperty(fillLayerId, 'fill-opacity', opacity);
        }
        // if (this.map.getLayer(lineLayerId)) {
        //   this.map.setPaintProperty(lineLayerId, 'line-opacity', opacity);
        // }
        if (this.map.getLayer(rasterLayerId)) {
          this.map.setPaintProperty(rasterLayerId, 'raster-opacity', opacity);
        }
      }
    }

    if (!this.compareArrays(layer.parameters, parameters)) {
      const drawnShapes = this.store.getState().drawnShapes;
      await this.addSource(layer.datasourceId, layer, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
      });
    }

    const datasource = this.getDatasource(layer.datasourceId);
    const drawnShapes = this.store.getState().drawnShapes;

    if (datasource && isEdrGrid(datasource) && (layer.from !== from || layer.to !== to)) {
      await this.addSource(layer.datasourceId, layer, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
        from,
        to,
      });
    }

    this.store.getState().updateLayer({
      ...layer,
      name,
      color,
      parameters,
      from,
      to,
      visible,
      opacity,
    });
  }

  private createParameterGroupMembers(parameterGroups: ParameterGroup[]): void {
    const parameterGroupMembers: ParameterGroupMembers = {};
    parameterGroups.forEach((parameterGroup) => {
      parameterGroupMembers[parameterGroup.label] = Object.keys(parameterGroup.members);
    });

    this.store.getState().setParameterGroupMembers(parameterGroupMembers);
  }

  /**
   *
   * @function
   */
  public async getCollections(): Promise<void> {
    const response = await awoService.getCollections();
    const { collections, parameterGroups } = response;

    const originalCollections = this.store.getState().originalCollections;
    if (originalCollections.length === 0) {
      this.store.getState().setOriginalCollections(collections);
    }

    this.store.getState().setCollections(collections);

    this.createParameterGroupMembers(parameterGroups);
  }

  private clearLayers(): void {
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

  private clearSources(): void {
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

    this.clearLayers();
    this.clearSources();

    this.store.getState().setProvider(null);
    this.store.getState().setCategory(null);
    this.store.getState().setCollection(null);
  }
}

export default MainManager;
