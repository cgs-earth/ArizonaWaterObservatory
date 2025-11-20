/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { BBox, Feature, FeatureCollection, Geometry, MultiPolygon, Point, Polygon } from 'geojson';
import {
  GeoJSONFeature,
  GeoJSONSource,
  Map,
  MapMouseEvent,
  Popup,
  RasterTileSource,
} from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
import {
  CollectionRestrictions,
  idStoreProperty,
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
import { getNextLink } from '@/managers/Main.utils';
import {
  Config,
  ExtendedFeatureCollection,
  GetConfigResponse,
  PostConfigResponse,
  SourceOptions,
} from '@/managers/types';
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
import { isSameArray } from '@/utils/compareArrays';
import { getIdStore } from '@/utils/getIdStore';
import { getRandomHexColor } from '@/utils/hexColor';
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
      const sourceId = this.getSourceId(layer.datasourceId, layer.id);
      this.addLayer(layer, sourceId);
    }

    // Set locations after loading layer to reflect selected state in map
    this.store.getState().setLocations(config.locations);

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

  private async fetchData(
    collectionId: ICollection['id'],
    bbox?: BBox,
    from?: string | null,
    to?: string | null,
    parameterNames?: string[],
    signal?: AbortSignal,
    next?: string
  ): Promise<FeatureCollection> {
    const collection = this.getDatasource(collectionId);

    if (!collection) {
      throw new Error('Datasource not found');
    }

    const collectionType = getCollectionType(collection);

    switch (collectionType) {
      case CollectionType.EDR:
      case CollectionType.Features:
        return await this.fetchItems(collectionId, parameterNames, bbox, signal, next);
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
        limit: 500,
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
  private storeIdentifiers(
    featureCollection: ExtendedFeatureCollection
  ): ExtendedFeatureCollection {
    return {
      ...featureCollection,
      features: featureCollection.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          [idStoreProperty]: feature.id,
        },
      })),
    };
  }

  /**
   *
   * @function
   */
  private async fetchItems(
    collectionId: ICollection['id'],
    parameterNames?: string[],
    bbox?: BBox,
    signal?: AbortSignal,
    next?: string
  ): Promise<ExtendedFeatureCollection> {
    const data = await awoService.getItems<ExtendedFeatureCollection>(
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
      return getDefaultGeoJSON();
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

  public async createLayer(datasourceId: ICollection['id'], signal?: AbortSignal) {
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
      parameters: [],
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
      visible: true,
      locations: [],
      opacity:
        collectionType === CollectionType.Map ? DEFAULT_RASTER_OPACITY : DEFAULT_FILL_OPACITY,
      position: layers.length + 1,
    };

    this.store.getState().addLayer(layer);

    const drawnShapes = this.store.getState().drawnShapes;
    const sourceId = this.getSourceId(datasource.id, layer.id);

    this.addSource(datasource.id, layer.id);
    this.addLayer(layer, sourceId);
    await this.addData(datasource.id, layer, {
      filterFeatures: drawnShapes,
      signal,
      noFetch: collectionType === CollectionType.EDRGrid,
    });

    this.reorderLayers();
  }

  public deleteLayer(layer: Layer) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layer.id);
    let layers = this.store.getState().layers.filter((_layer) => _layer.id !== layer.id);

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

  private getBBox(collectionId: ICollection['id']): BBox {
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

    this.checkDateRestrictions(collectionId, from, to);

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
        options?.parameterNames ?? layer.parameters,
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

  private getClickEventHandler(
    mapLayerId: string,
    layerId: string,
    collectionId: ICollection['id']
  ): (e: MapMouseEvent) => void {
    return (e) => {
      e.originalEvent.preventDefault();

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
    };
  }

  private getHoverEventHandler(
    name: string,
    collectionId: ICollection['id'],
    upperLabel: string,
    lowerLabel: string
  ): (e: MapMouseEvent) => void {
    return (e) => {
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
          this.getClickEventHandler(pointLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'click',
          fillLayerId,
          this.getClickEventHandler(fillLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'click',
          lineLayerId,
          this.getClickEventHandler(lineLayerId, layer.id, layer.datasourceId)
        );

        this.map.on(
          'mouseenter',
          [pointLayerId, fillLayerId, lineLayerId],
          this.getHoverEventHandler(layer.name, layer.datasourceId, upperLabel, lowerLabel)
        );
        this.map.on(
          'mousemove',
          [pointLayerId, fillLayerId, lineLayerId],
          this.getHoverEventHandler(layer.name, layer.datasourceId, upperLabel, lowerLabel)
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
    }
  }

  /**
   *
   * @function
   */
  public async getFeatures(layer: Layer, signal: AbortSignal): Promise<FeatureCollection> {
    try {
      const sourceId = this.getSourceId(layer.datasourceId, layer.id);

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

    const bbox = this.getBBox(layer.datasourceId);

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

    if (!isSameArray(layer.parameters, parameters)) {
      const drawnShapes = this.store.getState().drawnShapes;
      await this.addData(layer.datasourceId, layer, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
        from,
        to,
      });
    }

    const datasource = this.getDatasource(layer.datasourceId);
    const drawnShapes = this.store.getState().drawnShapes;

    if (datasource && isEdrGrid(datasource) && (layer.from !== from || layer.to !== to)) {
      await this.addData(layer.datasourceId, layer, {
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
