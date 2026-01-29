/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
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
import {
  GeoJSONFeature,
  GeoJSONSource,
  Map,
  MapMouseEvent,
  MapTouchEvent,
  Popup,
  RasterTileSource,
} from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import {
  CollectionRestrictions,
  idStoreProperty,
  ItemsOnlyCollections,
  RestrictionType,
  StringIdentifierCollections,
} from '@/consts/collections';
import { getDefaultGeoJSON } from '@/consts/geojson';
import {
  DEFAULT_BBOX,
  DEFAULT_FILL_OPACITY,
  DEFAULT_RASTER_OPACITY,
  drawLayers,
} from '@/features/Map/consts';
import { drawnFeatureContainsExtent } from '@/features/Map/utils';
import { getNextLink } from '@/managers/Main.utils';
import notificationManager from '@/managers/Notification.init';
import {
  Config,
  ExtendedFeatureCollection,
  GetConfigResponse,
  PostConfigResponse,
  SourceOptions,
  StyleOptions,
} from '@/managers/types';
import { CoverageGridService } from '@/services/coverageGrid.service';
import { ICollection, ParameterGroup } from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import {
  ColorValueHex,
  Layer,
  Location,
  MainState,
  PaletteDefinition,
  ParameterGroupMembers,
} from '@/stores/main/types';
import { NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType, isEdrGrid } from '@/utils/collection';
import { createDynamicStepExpression, isSamePalette } from '@/utils/colors';
import { isValidColorBrewerIndex } from '@/utils/colors/types';
import { isSameArray } from '@/utils/compareArrays';
import { getIdStore } from '@/utils/getIdStore';
import { getRandomHexColor } from '@/utils/hexColor';
import { isTopLayer } from '@/utils/isTopLayer';
import { joinSentence } from '@/utils/joinSentence';
import {
  getFillLayerDefinition,
  getLineLayerDefinition,
  getPointLayerDefinition,
  getRasterLayerSpecification,
} from '@/utils/layerDefinitions';
import { getProvider } from '@/utils/provider';
import { getTemporalExtent } from '@/utils/temporalExtent';

/**
 * MainManager is responsible for managing the core logic of the application. It handles functionality
 * like new layers, locations, config objects, and more. It bridges the map and the global state while
 * fetching the appropriate data for each layer instance.
 *
 * @class
 * @classdesc This class handles complex interactions between the map instance and the zustand store. It
 *  is responsible for loading data from the appropriate endpoint for each collection type. Any operation
 *  that requires interacting with more than one global state variable should occur in this
 *  class.
 */
class MainManager {
  private store: UseBoundStore<StoreApi<MainState>>;
  private map: Map | null = null;
  private hoverPopup: Popup | null = null;
  private draw: MapboxDraw | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
  }

  /**
   * Setter function to set map private variable after map initialization
   *
   * @function
   */
  public setMap(map: Map): void {
    if (!this.map) {
      this.map = map;
    }
  }

  /**
   * Setter function to set hoverPopup private variable after map initialization
   *
   * @function
   */
  public setPopup(popup: Popup): void {
    if (!this.hoverPopup) {
      this.hoverPopup = popup;
    }
  }

  /**
   * Setter function to set draw private variable after map initialization
   *
   * @function
   */
  public setDraw(draw: MapboxDraw): void {
    if (!this.draw) {
      this.draw = draw;
    }
  }

  /**
   * Creates a new v6 uuid
   *
   * @function
   */
  private createUUID(): string {
    return v6();
  }

  /**
   * Creates layer hex color
   *
   * @function
   */
  private createHexColor(): ColorValueHex {
    return getRandomHexColor();
  }

  /**
   * Ensure type safety in imported config
   *
   * @param {Config | undefined} config - The possible state config object.
   *
   * @function
   */
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

  /**
   * Retrieve persistant values from global and map state.
   *
   * @function
   */
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

  /**
   * Extract job uuid from the returned url.
   *
   * @param {string} jobId - The url returned from the processes endpoint, contains the share Id.
   * @function
   */
  private getShareId(jobId: string): string | undefined {
    const uuid = jobId.split('/').pop();
    return uuid;
  }

  /**
   * Write the config object to persistant storage. Return the share Id.
   *
   * @param {AbortSignal} [signal] - (Optional) Abort request signal from calling component
   * @function
   */
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
      // Extract job uuid to retrieve the config later
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

  /**
   * Retrieve the config object from persistant storage using the share Id.
   *
   * @param {string} shareId - The job uuid returned from the processes endpoint
   * @param {AbortSignal} [signal] - (Optional) Abort request signal from calling component
   * @function
   */
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

  /**
   * Validate and load the retrieved config object. Returns a boolean to indicate successful load.
   *
   * @param {Config} config - The retrieved state config object.
   *
   * @function
   */

  public async loadConfig(config: Config): Promise<boolean> {
    const validity = this.isValidConfig(config);
    if (!this.map || !this.draw || !validity.valid) {
      return false;
    }

    const store = this.store.getState();
    store.setLayers(config.layers);
    store.setProvider(config.provider);
    store.setCategory(config.category);
    store.setCollection(config.collection);
    store.setCharts(config.charts);
    store.setDrawnShapes(config.drawnShapes);

    // Rehydrate drawn shapes
    for (const shape of config.drawnShapes) {
      this.draw.add(shape);
    }

    this.map.setZoom(config.zoom);
    this.map.setCenter(config.center);
    this.map.setBearing(config.bearing);
    this.map.setPitch(config.pitch);
    store.setBasemap(config.basemap);

    // Wait for idle after loading basemap to prevent conflicts with
    // style.load
    await new Promise<void>((resolve, reject) => {
      // Safety timeout
      const timeoutMs = 15000;
      const timer = setTimeout(() => {
        reject(new Error(`Configuration load timed out waiting for 'idle' after ${timeoutMs}ms`));
      }, timeoutMs);

      this.map!.once('idle', async () => {
        try {
          const dataFetches: Promise<void>[] = [];

          for (const layer of config.layers) {
            const sourceId = this.getSourceId(layer.datasourceId, layer.id);
            this.addSource(layer.datasourceId, layer.id);
            this.addLayer(layer, sourceId);

            // Use applySpatialFilter, this will factor in drawn shapes but fallback
            // to addData if none exists
            dataFetches.push(this.applySpatialFilter(config.drawnShapes));
          }

          // Fetch concurrently
          await Promise.all(dataFetches);

          // Set locations after layers are present so the map can reflect selected state
          store.setLocations(config.locations);

          // Assert layer order
          this.reorderLayers();

          clearTimeout(timer);
          resolve();
        } catch (err) {
          clearTimeout(timer);
          reject(
            err instanceof Error
              ? err
              : new Error('Unknown error occurred while loading configuration')
          );
        }
      });

      // Force an idle to handle edge case where basemap sets quickly
      this.map!.triggerRepaint();
    });

    return true;
  }

  public getUniqueIds(features: GeoJSONFeature[], collectionId: ICollection['id']): Array<string> {
    const uniques = new Set<string>();

    const useIdStore = StringIdentifierCollections.includes(collectionId);

    for (const feature of features) {
      if (useIdStore) {
        const id = getIdStore(feature);
        if (id) {
          uniques.add(id);
        } else {
          console.error(
            'Unable to find id store on layer from collection: ',
            collectionId,
            ', feature: ',
            feature
          );
        }
      } else if (feature.id) {
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

  private async fetchData<
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
    const collection = this.getDatasource(collectionId);

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
    const data = await awoService.getLocations<FeatureCollection<T, V>>(
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
    const data = await awoService.getItems<ExtendedFeatureCollection<T, V>>(
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

  private getTo(datasource: ICollection): dayjs.Dayjs {
    const temporalExtent = getTemporalExtent(datasource);

    if (temporalExtent) {
      const { max } = temporalExtent;
      if (max && dayjs(max).isValid()) {
        return dayjs(max);
      }
    }

    return dayjs();
  }

  private getFrom(
    datasourceId: ICollection['id'],
    collectionType: CollectionType,
    to: dayjs.Dayjs
  ) {
    const restrictions = CollectionRestrictions[datasourceId];
    if (restrictions && restrictions.length > 0) {
      const dateRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );
      if (dateRestriction && dateRestriction.days) {
        return to.subtract(dateRestriction.days, 'day');
      }
    }

    return collectionType === CollectionType.EDRGrid
      ? to.subtract(1, 'year')
      : to.subtract(1, 'week');
  }

  public async createLayer(
    datasourceId: ICollection['id'],
    parameters: Layer['parameters'],
    signal?: AbortSignal
  ) {
    const datasource = this.getDatasource(datasourceId);

    if (!datasource) {
      throw new Error('Datasource not found');
    }

    const currentDatasourceCount = this.getDatasourceCount(datasource.id);
    const layers = this.store.getState().layers;

    if (layers.length === 10) {
      throw new Error('Layer limit reached.');
    }

    const provider = getProvider(datasource.id);

    const collectionType = getCollectionType(datasource);
    const title = datasource.title ?? datasource.id;

    let next = 1;
    let name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    while (layers.some((layer) => layer.name === name)) {
      name = `${provider} ${title} ${currentDatasourceCount + next++}`;
    }

    const to = this.getTo(datasource);
    const from = this.getFrom(datasourceId, collectionType, to);

    const layer: Layer = {
      id: this.createUUID(),
      datasourceId: datasource.id,
      name,
      color: this.createHexColor(),
      parameters,
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
      visible: true,
      locations: [],
      opacity:
        collectionType === CollectionType.Map ? DEFAULT_RASTER_OPACITY : DEFAULT_FILL_OPACITY,
      position: layers.length + 1,
      paletteDefinition: null,
    };

    this.store.getState().addLayer(layer);

    const drawnShapes = this.store.getState().drawnShapes;
    const sourceId = this.getSourceId(datasource.id, layer.id);

    this.addSource(datasource.id, layer.id);
    this.addLayer(layer, sourceId);
    await this.addData(datasource.id, layer, {
      filterFeatures: drawnShapes,
      signal,
      noFetch: collectionType === CollectionType.EDRGrid && layer.parameters.length === 0,
    });

    this.reorderLayers();
  }

  public async styleLayer(
    layer: Layer,
    paletteDefinition: PaletteDefinition,
    {
      features,
      signal,
      updateStore = true,
    }: StyleOptions<{ [paletteDefinition.parameter]: number }>
  ) {
    if (!this.map) {
      return;
    }

    const defaultedfeatures =
      features ??
      (await this.getFeatures<Geometry, { [paletteDefinition.parameter]: number }>(layer, signal))
        .features;

    const { parameter, count, palette, index } = paletteDefinition;
    const expression = createDynamicStepExpression(
      defaultedfeatures,
      parameter,
      palette,
      count,
      index
    );

    if (updateStore) {
      this.store.getState().updateLayer({
        ...layer,
        color: expression,
        paletteDefinition,
      });
    }

    const { pointLayerId, fillLayerId, lineLayerId } = this.getLocationsLayerIds(
      layer.datasourceId,
      layer.id
    );

    if (this.map.getLayer(pointLayerId)) {
      this.map.setPaintProperty(pointLayerId, 'circle-color', expression);
    }
    if (this.map.getLayer(fillLayerId)) {
      this.map.setPaintProperty(fillLayerId, 'fill-color', expression);
    }
    if (this.map.getLayer(lineLayerId)) {
      this.map.setPaintProperty(lineLayerId, 'line-color', expression);
    }

    return expression;
  }

  public deleteLayer(layer: Layer) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layer.id);
    let layers = this.store.getState().layers.filter((_layer) => _layer.id !== layer.id);
    const locations = this.store
      .getState()
      .locations.filter((location) => location.layerId !== layer.id);

    layers = layers
      .sort((a, b) => a.position - b.position)
      .map((l, index) => ({ ...l, position: index + 1 }));

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
    this.store.getState().setLocations(locations);
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
      for (const layerId of [pointLayerId, lineLayerId, fillLayerId, rasterLayerId]) {
        if (this.map.getLayer(layerId)) {
          if (lastLayer.length > 0) {
            this.map.moveLayer(layerId, lastLayer);
          }
          lastLayer = layerId;
        }
      }
    }

    drawLayers.forEach((layerId) => this.map!.moveLayer(layerId));
  }

  /**
   *
   * @function
   */
  public getSourceId(collectionId: ICollection['id'], layerId: Layer['id']): string {
    return `user-${collectionId}-${layerId}-source`;
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

  private filterLocations<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(
    featureCollection: FeatureCollection<T, V>,
    filterFeatures: Feature<Polygon | MultiPolygon>[] = []
  ): FeatureCollection<T, V> {
    if (filterFeatures.length > 0) {
      return this.filterByGeometryType(featureCollection, filterFeatures);
    }

    return featureCollection;
  }

  private checkParameterRestrictions(
    collectionId: ICollection['id'],
    parameters: Layer['parameters']
  ) {
    const restrictions = CollectionRestrictions[collectionId];
    if (restrictions && restrictions.length > 0) {
      const parameterRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Parameter
      );

      if (parameterRestriction) {
        const datasource = this.getDatasource(collectionId);
        const hasNoParameters = parameters.length === 0;

        if (hasNoParameters || parameters.length > parameterRestriction.count) {
          let message = `Dataset: ${datasource?.title}, requires at least one and up to ${parameterRestriction.count} parameter${parameters.length - parameterRestriction.count > 1 ? 's' : ''} to be fetched at one time.`;
          if (hasNoParameters) {
            message += ' Please select at least one parameter.';
          } else {
            message += ` Please remove ${parameters.length - parameterRestriction.count} parameter${parameters.length - parameterRestriction.count > 1 ? 's' : ''}`;
          }
          throw new Error(message);
        }
      }
    }
  }

  private checkDateRestrictions(
    collectionId: ICollection['id'],
    from: Layer['from'],
    to: Layer['to']
  ) {
    const restrictions = CollectionRestrictions[collectionId];

    if (restrictions && restrictions.length > 0) {
      const dateRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Day
      );

      if (dateRestriction && dateRestriction.days) {
        const datasource = this.getDatasource(collectionId);
        if (!from || !to) {
          throw new Error(
            `Dataset: ${datasource?.title}, requires a bounded date range of no longer than ${dateRestriction.days} days.`
          );
        }
        const diff = dayjs(to).diff(dayjs(from), 'days');

        if (diff > dateRestriction.days) {
          throw new Error(
            `Dataset: ${datasource?.title}, requires a bounded date range of no longer than ${dateRestriction.days}. Current date range is ${diff - dateRestriction.days} days too long.`
          );
        }
      }
    }
  }

  private checkCollectionBBoxRestrictions(collectionId: ICollection['id'], area: number) {
    const restrictions = CollectionRestrictions[collectionId];

    if (restrictions && restrictions.length > 0) {
      const sizeRestriction = restrictions.find(
        (restriction) => restriction.type === RestrictionType.Size
      );

      if (sizeRestriction && sizeRestriction.size && area > sizeRestriction.size) {
        const datasource = this.getDatasource(collectionId);
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

  public getBBox(collectionId: ICollection['id']): BBox {
    const drawnShapes = this.store.getState().drawnShapes;

    if (drawnShapes.length === 0) {
      this.checkCollectionBBoxRestrictions(collectionId, turf.area(turf.bboxPolygon(DEFAULT_BBOX)));
      return DEFAULT_BBOX;
    }

    const featureCollection = turf.featureCollection(drawnShapes);

    const userBBox = turf.bbox(featureCollection);

    this.validateBBox(userBBox, collectionId);

    return userBBox;
  }

  private async addData(collectionId: ICollection['id'], layer: Layer, options?: SourceOptions) {
    const datasource = this.getDatasource(collectionId);
    const sourceId = this.getSourceId(collectionId, layer.id);

    if (datasource) {
      const collectionType = getCollectionType(datasource);

      if (
        [CollectionType.EDR, CollectionType.Features, CollectionType.EDRGrid].includes(
          collectionType
        )
      ) {
        await this.addGeoJsonData(collectionId, layer, options);
      }
    }

    return sourceId;
  }

  private addSource(collectionId: ICollection['id'], layerId: Layer['id']) {
    const datasource = this.getDatasource(collectionId);
    const sourceId = this.getSourceId(collectionId, layerId);

    if (datasource) {
      const collectionType = getCollectionType(datasource);

      if (
        [CollectionType.EDR, CollectionType.Features, CollectionType.EDRGrid].includes(
          collectionType
        )
      ) {
        this.addGeoJsonSource(collectionId, layerId);
      } else if (collectionType === CollectionType.Map) {
        this.addRasterSource(datasource, layerId);
      }
    }

    return sourceId;
  }

  private getNoDataMessage(
    name: string,
    parameterCount: number,
    collectionId: ICollection['id']
  ): string {
    const datasource = this.getDatasource(collectionId);
    if (!datasource) {
      return `No data found for layer: ${name}.`;
    }

    const collectionType = getCollectionType(datasource);
    const hasDrawnShapes = this.store.getState().drawnShapes.length > 0;

    const suggestions: string[] = [];

    const isEDR = collectionType === CollectionType.EDR;
    const isEDRGrid = collectionType === CollectionType.EDRGrid;
    const isFeatures = collectionType === CollectionType.Features;

    if (isEDR || isEDRGrid) {
      if (parameterCount > 0) {
        suggestions.push('Try a different parameter');
      }

      if (isEDRGrid) {
        suggestions.push(suggestions.length > 0 ? 'date range' : 'Try a different date range');

        if (hasDrawnShapes) {
          suggestions.push('modify your area of interest');
        }
      }

      if (isEDR && hasDrawnShapes) {
        suggestions.push(
          suggestions.length > 0
            ? 'modify your area of interest'
            : 'Try a different area of interest'
        );
      }
    }

    if (isFeatures && hasDrawnShapes) {
      suggestions.push('Modify your area of interest');
    }

    const suggestionText = joinSentence(suggestions, 'or');

    return suggestionText
      ? `No data found for layer: ${name}. ${suggestionText}.`
      : 'No data found.';
  }

  /**
   * * Adds (or updates) a GeoJSON source and pages through all results,
   * streaming each page into the source as it arrives.
   *
   * @function
   */
  private async addGeoJsonData(
    collectionId: ICollection['id'],
    layer: Layer,
    options?: SourceOptions
  ): Promise<string> {
    const sourceId = this.getSourceId(collectionId, layer.id);

    if (!this.map) {
      return sourceId;
    }

    const source = this.map.getSource(sourceId) as GeoJSONSource | undefined;

    if (options?.noFetch || !source) {
      return sourceId;
    }

    const bbox = this.getBBox(collectionId);
    const from = options?.from ?? layer.from;
    const to = options?.to ?? layer.to;
    const parameters = options?.parameterNames ?? layer.parameters;

    this.checkDateRestrictions(collectionId, from, to);

    this.checkParameterRestrictions(collectionId, parameters);

    let aggregate = getDefaultGeoJSON();
    let next: string | undefined;

    do {
      if (options?.signal?.aborted) {
        break;
      }

      const page = await this.fetchData(
        collectionId,
        bbox,
        from,
        to,
        parameters,
        options?.signal,
        next
      );

      let filtered = this.filterLocations(page, options?.filterFeatures);
      this.clearInvalidLocations(layer.id, collectionId, filtered);
      if (Array.isArray(filtered.features)) {
        aggregate.features.push(...filtered.features);
        source.setData(aggregate);
      }

      (filtered as any) = undefined;
      next = getNextLink(page);
    } while (next);

    if (aggregate.features.length === 0) {
      const message = this.getNoDataMessage(layer.name, parameters.length, collectionId);

      notificationManager.show(message, NotificationType.Info, 10000);
    }

    if (layer.paletteDefinition) {
      const features = aggregate.features as Feature<
        Geometry,
        { [layer.paletteDefinition.parameter]: number }
      >[];
      this.styleLayer(layer, layer.paletteDefinition, { features, signal: options?.signal });
    }

    (aggregate as any) = undefined;

    return sourceId;
  }

  /**
   *
   * @function
   */
  /**
   * Adds (or updates) a GeoJSON source and pages through all results,
   * streaming each page into the source as it arrives.
   */
  private addGeoJsonSource(collectionId: ICollection['id'], layerId: Layer['id']): string {
    const sourceId = this.getSourceId(collectionId, layerId);

    if (!this.map) {
      return sourceId;
    }

    const source = this.map.getSource(sourceId) as GeoJSONSource | undefined;
    if (!source) {
      this.map.addSource(sourceId, {
        type: 'geojson',
        data: getDefaultGeoJSON(),
      });
    }

    return sourceId;
  }

  private addRasterSource(collection: ICollection, layerId: Layer['id']) {
    const link = collection.links.find(
      (link) => link.rel.includes('map') && link.type === 'image/png'
    );
    const sourceId = this.getSourceId(collection.id, layerId);
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
        this.addStandardLayer(layer, sourceId, collectionType);
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

  private getLabels(collectionType: CollectionType): {
    upperLabel: string;
    lowerLabel: string;
  } {
    switch (collectionType) {
      case CollectionType.EDR:
        return {
          upperLabel: 'Location',
          lowerLabel: 'location',
        };
      case CollectionType.EDRGrid:
        return {
          upperLabel: 'Grid',
          lowerLabel: 'grid',
        };

      case CollectionType.Features:
      default:
        return {
          upperLabel: 'Item',
          lowerLabel: 'item',
        };
    }
  }

  private getClickEventHandler<T extends MapMouseEvent | MapTouchEvent>(
    mapLayerId: string,
    layerId: string,
    collectionId: ICollection['id']
  ): (e: T) => void {
    return (e) => {
      if (e.originalEvent.cancelBubble) {
        return;
      }

      const drawnFeatures = this.map!.queryRenderedFeatures(e.point, { layers: drawLayers });

      // Check if the edges of the drawn feature are visible
      const drawnFeature = drawnFeatures[0];

      const includeDrawLayers =
        drawnFeatures.length > 0 &&
        !drawnFeatureContainsExtent(drawnFeature, this.draw!, this.map!);

      if (!isTopLayer(layerId, collectionId, this.map!, e.point, includeDrawLayers)) {
        return;
      }

      const drawMode = this.store.getState().drawMode;

      const drawInactive = drawMode === null;

      if (drawInactive && !e.originalEvent.defaultPrevented) {
        e.originalEvent.preventDefault();
        e.originalEvent.cancelBubble = true;

        const features = this.map!.queryRenderedFeatures(e.point, {
          layers: [mapLayerId],
        });
        if (features.length > 0) {
          // Hack, use the feature id to track this location, fetch id store in consuming features
          const uniqueFeatures = this.getUniqueIds(features, collectionId);

          uniqueFeatures.forEach((locationId) => {
            if (this.hasLocation(locationId)) {
              this.store.getState().removeLocation({
                id: locationId,
                layerId,
              });
            } else {
              this.store.getState().addLocation({
                id: locationId,
                layerId,
              });
            }
          });
        }
      }
    };
  }

  private getHoverEventHandler(
    name: string,
    layerId: Layer['id'],
    collectionId: ICollection['id'],
    upperLabel: string,
    lowerLabel: string
  ): (e: MapMouseEvent) => void {
    return (e) => {
      const drawMode = this.store.getState().drawMode;

      const drawActive = drawMode !== null;

      const drawnFeatures = this.map!.queryRenderedFeatures(e.point, { layers: drawLayers });

      // Check if the edges of the drawn feature are visible
      const drawnFeature = drawnFeatures[0];

      const includeDrawLayers =
        drawnFeatures.length > 0 &&
        !drawnFeatureContainsExtent(drawnFeature, this.draw!, this.map!);

      // As layers can be added in any order, and reordered, perform manual check to ensure popup shows
      // for top layer in visual order
      if (!isTopLayer(layerId, collectionId, this.map!, e.point, includeDrawLayers)) {
        return;
      }

      if (drawActive) {
        return;
      }

      this.map!.getCanvas().style.cursor = 'pointer';
      const { features } = e;
      if (features && features.length > 0) {
        const uniqueFeatures = this.getUniqueIds(features, collectionId);
        const html = `
            <span style="color:black;">
              <strong>${name}</strong><br/>
              ${uniqueFeatures.map((locationId) => `<strong>${upperLabel} Id: </strong>${locationId}`).join('<br/>')}
              <div style="margin-top: 16px;display:flex;flex-direction:column;justify-content:center;align-items:center">
                <p style="margin: 0;">Click to select the ${lowerLabel}.</p>
                <p style="margin: 0;">Double-click to preview.</p>
              </div>
            </span>
          `;
        this.hoverPopup!.setLngLat(e.lngLat).setHTML(html).addTo(this.map!);
      }
    };
  }

  /**
   *
   * @function
   */
  private addStandardLayer(layer: Layer, sourceId: string, collectionType: CollectionType): void {
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
        const { upperLabel, lowerLabel } = this.getLabels(collectionType);

        this.map.addLayer(getFillLayerDefinition(fillLayerId, sourceId, layer.color));
        this.map.addLayer(getLineLayerDefinition(lineLayerId, sourceId, layer.color));
        this.map.addLayer(getPointLayerDefinition(pointLayerId, sourceId, layer.color));

        this.map.on(
          'click',
          pointLayerId,
          this.getClickEventHandler<MapMouseEvent>(pointLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'click',
          fillLayerId,
          this.getClickEventHandler<MapMouseEvent>(fillLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'click',
          lineLayerId,
          this.getClickEventHandler<MapMouseEvent>(lineLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'touchend',
          pointLayerId,
          this.getClickEventHandler<MapTouchEvent>(pointLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'touchend',
          fillLayerId,
          this.getClickEventHandler<MapTouchEvent>(fillLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'touchend',
          lineLayerId,
          this.getClickEventHandler<MapTouchEvent>(lineLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'mouseenter',
          [pointLayerId, fillLayerId, lineLayerId],
          this.getHoverEventHandler(
            layer.name,
            layer.id,
            layer.datasourceId,
            upperLabel,
            lowerLabel
          )
        );
        this.map.on(
          'mousemove',
          [pointLayerId, fillLayerId, lineLayerId],
          this.getHoverEventHandler(
            layer.name,
            layer.id,
            layer.datasourceId,
            upperLabel,
            lowerLabel
          )
        );
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

      drawLayers.forEach((layerId) => {
        this.map!.moveLayer(layerId);
      });
    }
  }

  /**
   *
   * @function
   */
  public async getFeatures<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(layer: Layer, signal?: AbortSignal): Promise<FeatureCollection<T, V>> {
    try {
      const sourceId = this.getSourceId(layer.datasourceId, layer.id);

      const source = this.map?.getSource(sourceId) as GeoJSONSource;

      const data = source._data;
      if (typeof data !== 'string') {
        const featureCollection = turf.featureCollection<T, V>(
          (data as FeatureCollection<T, V>).features as Feature<T, V>[]
        );

        return featureCollection;
      }
    } catch (error) {
      console.error(error);
    }

    const bbox = this.getBBox(layer.datasourceId);

    const data = await this.fetchData<T, V>(
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
          return await this.addData(collectionId, layer, {
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
    opacity: Layer['opacity'],
    paletteDefinition: Layer['paletteDefinition']
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
        const { fillLayerId, lineLayerId, rasterLayerId } = layerIds;
        if (this.map.getLayer(fillLayerId)) {
          let fillOpacity = opacity;
          fillOpacity = Math.max(0, opacity * DEFAULT_FILL_OPACITY);
          this.map.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacity);
        }

        if (this.map.getLayer(lineLayerId)) {
          this.map.setPaintProperty(lineLayerId, 'line-opacity', opacity);
        }

        if (this.map.getLayer(rasterLayerId)) {
          this.map.setPaintProperty(rasterLayerId, 'raster-opacity', opacity);
        }
      }
    }

    const datasource = this.getDatasource(layer.datasourceId);

    const parametersChanged = !isSameArray(layer.parameters, parameters);
    const temporalRangeChanged =
      datasource && isEdrGrid(datasource) && (layer.from !== from || layer.to !== to);
    const paletteChanged = !isSamePalette(paletteDefinition, layer.paletteDefinition);

    // If the parameters have changed, or this is a grid layer and the temporal range has updated
    // grid layers are the only instance where temporal filtering applies, requiring a new fetch
    let _color = color;
    if (parametersChanged || temporalRangeChanged) {
      const drawnShapes = this.store.getState().drawnShapes;
      await this.addData(layer.datasourceId, layer, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
        from,
        to,
      });
    }

    let correctedPaletteDefinition = paletteDefinition;
    if (paletteChanged && paletteDefinition) {
      const expression = await this.styleLayer(layer, paletteDefinition, { updateStore: false });
      if (expression) {
        _color = expression;

        if (expression.length !== paletteDefinition.count * 2 + 3) {
          const count = (expression.length - 3) / 2;

          if (isValidColorBrewerIndex(count)) {
            correctedPaletteDefinition = {
              ...paletteDefinition,
              count,
            };
            notificationManager.show(
              `Duplicate thresholds detected. Reducing to ${count} threshold(s)`,
              NotificationType.Info,
              5000
            );
          }
        }
      }
    }

    this.store.getState().updateLayer({
      ...layer,
      name,
      color: _color,
      parameters,
      from,
      to,
      visible,
      opacity,
      paletteDefinition: correctedPaletteDefinition,
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
    const layers = this.store.getState().layers;

    for (const collection of originalCollections) {
      const collectionLayers = layers.filter((layer) => layer.datasourceId === collection.id);
      for (const layer of collectionLayers) {
        const sourceId = this.getSourceId(collection.id, layer.id);
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
        }
      }
    }
  }

  public clearAllData(): void {
    this.store.getState().setLocations([]);

    this.store.getState().setLayers([]);
    this.store.getState().setDrawnShapes([]);

    this.clearLayers();
    this.clearSources();

    this.store.getState().setProvider(null);
    this.store.getState().setCategory(null);
    this.store.getState().setCollection(null);
  }
}

export default MainManager;
