/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  MultiPolygon,
  Polygon,
} from 'geojson';
import { Map as MapboxMap } from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import { CollectionDefaultLabels } from '@/consts/collections';
import { LayerId } from '@/features/Map/config';
import { DEFAULT_FILL_OPACITY, DEFAULT_RASTER_OPACITY, drawLayers } from '@/features/Map/consts';
import { SourceId } from '@/features/Map/sources';
import { stringifyBBox } from '@/managers/main/Main.utils';
import NotificationManager from '@/managers/Notification.manager';
import { ApplySpatialFilterOptions, StyleOptions } from '@/managers/types';
import { CollectionService } from '@/services/collection.service';
import { DataService } from '@/services/data.service';
import { ICollection, ParameterGroup } from '@/services/edr.service';
import { FactoryService } from '@/services/factory.service';
import { FetchService } from '@/services/fetch.service';
import awoService from '@/services/init/awo.init';
import { MapService } from '@/services/map.service';
import { PopupService } from '@/services/popup.service';
import { SpatialService } from '@/services/spatial.service';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { Layer, MainState, PaletteDefinition, ParameterGroupMembers } from '@/stores/main/types';
import { NotificationVariant } from '@/stores/session/types';
import { CollectionType, getCollectionType, isEdrGrid } from '@/utils/collection';
import { createDynamicStepExpression, isSamePalette } from '@/utils/colors';
import { ColorBrewerIndex, isValidColorBrewerIndex } from '@/utils/colors/types';
import { isSameArray } from '@/utils/compareArrays';
import { getProvider } from '@/utils/provider';

type MainManagerDependencies = {
  collectionService: CollectionService;
  dataService: DataService;
  factoryService: FactoryService;
  fetchService: FetchService;
  mapService: MapService;
  notificationManager: NotificationManager;
  popupService: PopupService;
  spatialService: SpatialService;
};

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
  private deps: MainManagerDependencies;
  private map: MapboxMap | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>, deps: MainManagerDependencies) {
    this.store = store;
    this.deps = deps;
  }

  /**
   * TODO: decouple main manager from map interactions
   * Setter function to set map private variable after map initialization
   *
   * @function
   */
  public setMap(map: MapboxMap): void {
    if (!this.map) {
      this.map = map;
    }
  }

  public async createLayer(
    datasourceId: ICollection['id'],
    parameters: Layer['parameters'],
    signal?: AbortSignal
  ) {
    const datasource = this.deps.collectionService.getDatasource(datasourceId);

    if (!datasource) {
      throw new Error('Datasource not found');
    }

    const currentDatasourceCount = this.deps.collectionService.getDatasourceCount(datasource.id);
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

    const to = this.deps.factoryService.getTo(datasource);
    const from = this.deps.factoryService.getFrom(datasourceId, collectionType, to);

    const currentBBox = stringifyBBox(this.deps.spatialService.getBBox(datasourceId));

    const label = CollectionDefaultLabels[datasourceId] ?? null;

    const layer: Layer = {
      id: this.deps.factoryService.createUUID(),
      datasourceId: datasource.id,
      name,
      color: this.deps.factoryService.createHexColor(),
      parameters,
      from: from.format('YYYY-MM-DD'),
      to: to.format('YYYY-MM-DD'),
      visible: true,
      locations: [],
      opacity:
        collectionType === CollectionType.Map ? DEFAULT_RASTER_OPACITY : DEFAULT_FILL_OPACITY,
      position: layers.length + 1,
      paletteDefinition: null,
      geometryTypes: [],
      bbox: currentBBox,
      label,
      loaded: false,
      timeDataUpdated: Date.now(),
    };

    this.store.getState().addLayer(layer);

    const drawnShapes = this.store.getState().drawnShapes;
    const sourceId = this.deps.factoryService.getSourceId(datasource.id, layer.id);

    this.deps.mapService.addSource(datasource.id, layer.id);
    this.deps.mapService.addLayer(layer, sourceId);
    await this.deps.dataService.addData(datasource.id, layer, {
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
    }: StyleOptions<{ [paletteDefinition.parameter]: number }> = {} as StyleOptions<{
      [paletteDefinition.parameter]: number;
    }>
  ) {
    if (!this.map) {
      return;
    }

    const defaultedfeatures =
      features ??
      (await this.getFeatures<Geometry, { [paletteDefinition.parameter]: number }>(layer, signal))
        .features;

    const { parameter, originalCount, actualCount, palette, index } = paletteDefinition;
    const expression = createDynamicStepExpression(
      defaultedfeatures,
      parameter,
      palette,
      originalCount, // Always try to maximize the number of groups
      index
    );

    if (updateStore) {
      let newCount: ColorBrewerIndex = originalCount;

      if (expression.length !== originalCount * 2 + 3) {
        newCount = ((expression.length - 3) / 2) as ColorBrewerIndex;

        if (isValidColorBrewerIndex(newCount) && newCount !== actualCount) {
          this.deps.notificationManager.show(
            `Duplicate thresholds detected. Reducing to ${newCount} threshold(s)`,
            NotificationVariant.Info,
            5000
          );
        }
      }
      this.store.getState().updateLayer({
        ...layer,
        color: expression,
        paletteDefinition: {
          ...paletteDefinition,
          actualCount: newCount,
        },
      });
    }

    const { pointLayerId, fillLayerId, lineLayerId } =
      this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id);

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
      const layerIds = Object.values(
        this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id)
      );
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }

      this.deps.popupService.clearStalePopup((layerId) => layerId === layer.id);
    }

    this.store.getState().setCharts(charts);
    this.store.getState().setLayers(layers);
    this.store.getState().setLocations(locations);
  }

  public reorderLayers() {
    if (!this.map) {
      return;
    }

    if (this.map.getLayer(LayerId.SpatialSelectionBBox)) {
      this.map.moveLayer(LayerId.SpatialSelectionBBox);
    }
    if (this.map.getLayer(LayerId.SpatialSelection)) {
      this.map.moveLayer(LayerId.SpatialSelection);
    }

    const layers = [...this.store.getState().layers].sort((a, b) => a.position - b.position);
    let lastLayer = '';

    for (const layer of layers) {
      const { rasterLayerId, fillLayerId, lineLayerId, pointLayerId } =
        this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id);

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
  public async getFeatures<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(layer: Layer, signal?: AbortSignal): Promise<FeatureCollection<T, V>> {
    try {
      const sourceId = this.deps.factoryService.getSourceId(layer.datasourceId, layer.id);

      const featureCollection = this.deps.mapService.getMapFeatures<T, V>(sourceId);
      if (featureCollection) {
        return featureCollection;
      }
    } catch (error) {
      console.error(error);
    }

    const bbox = this.deps.spatialService.getBBox(layer.datasourceId);

    const data = await this.deps.fetchService.fetchData<T, V>(
      layer.datasourceId,
      bbox,
      layer.from,
      layer.to,
      layer.parameters,
      signal
    );

    const drawnShapes = this.store.getState().drawnShapes;
    const spatialSelection = this.store.getState().spatialSelection;
    let filter = drawnShapes;
    if (
      drawnShapes.length === 0 &&
      spatialSelection &&
      spatialSelection.strict &&
      isSpatialSelectionPredefined(spatialSelection)
    ) {
      try {
        const featureCollection = this.deps.mapService.getMapFeatures<Polygon | MultiPolygon>(
          SourceId.SpatialSelection
        );
        if (featureCollection) {
          filter = featureCollection.features;
        }
      } catch (error) {
        console.error(error);
      }
    }

    const filteredData = this.deps.spatialService.filterLocations(layer.datasourceId, data, filter);

    return filteredData;
  }

  public async applySpatialFilter(
    drawnShapes: Feature<Polygon | MultiPolygon>[],
    options?: ApplySpatialFilterOptions
  ): Promise<void> {
    const layers = this.store.getState().layers;

    const chunkSize = 5;
    const results: PromiseSettledResult<Layer['id']>[] = [];

    for (let i = 0; i < layers.length; i += chunkSize) {
      const chunk = layers.slice(i, i + chunkSize);

      const settled = await Promise.allSettled(
        chunk.map(async (layer) => {
          const collectionId = layer.datasourceId;

          // addData should return the layerId
          return this.deps.dataService.addData(collectionId, layer, {
            filterFeatures: drawnShapes,
            signal: options?.signal,
          });
        })
      );

      results.push(...settled);

      await Promise.all(
        settled
          .map((result) => {
            if (result.status === 'rejected') {
              return null;
            }

            const layerId = result.value;
            const layer = this.deps.collectionService.getLayer(layerId);
            if (!layer || !layer.paletteDefinition) {
              return null;
            }

            return this.styleLayer(layer, layer.paletteDefinition);
          })
          // Filter null results (status === 'rejected')
          .filter(Boolean) as Promise<void>[]
      );

      for (const result of settled) {
        if (result.status === 'rejected') {
          this.deps.notificationManager.show(
            'An error occurred while applying a spatial filter, check the console for more details.',
            NotificationVariant.Error,
            10000
          );
          console.error('applySpatialFilter: addData failed:', result.reason);
        }
      }
    }
  }

  private createParameterGroupMembers(parameterGroups: ParameterGroup[]): void {
    const parameterGroupMembers: ParameterGroupMembers = {};
    parameterGroups.forEach((parameterGroup) => {
      parameterGroupMembers[parameterGroup.label] = Object.keys(parameterGroup.members);
    });

    this.store.getState().setParameterGroupMembers(parameterGroupMembers);
  }

  /**
   * TODO: move this to fetch?
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

  public clearAllData(): void {
    this.deps.mapService.clearLayers();
    this.deps.mapService.clearSources();

    this.store.getState().setLocations([]);

    this.store.getState().setLayers([]);
    this.store.getState().setDrawnShapes([]);

    this.store.getState().setProvider(null);
    this.store.getState().setCategory(null);
    this.store.getState().setCollection(null);
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
    const layerIds = this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id);

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

    const datasource = this.deps.collectionService.getDatasource(layer.datasourceId);

    const parametersChanged = !isSameArray(layer.parameters, parameters);
    const temporalRangeChanged =
      datasource && isEdrGrid(datasource) && (layer.from !== from || layer.to !== to);

    const currentBBox = stringifyBBox(this.deps.spatialService.getBBox(layer.datasourceId));
    const paletteChanged = !isSamePalette(paletteDefinition, layer.paletteDefinition);
    const repalette =
      paletteChanged ||
      currentBBox !== layer.bbox ||
      (paletteDefinition && paletteDefinition.actualCount !== paletteDefinition.originalCount);

    // If the parameters have changed, or this is a grid layer and the temporal range has updated
    // grid layers are the only instance where temporal filtering applies, requiring a new fetch
    let _color = color;
    if (parametersChanged || temporalRangeChanged || paletteChanged) {
      const drawnShapes = this.store.getState().drawnShapes;

      await this.deps.dataService.addData(layer.datasourceId, layer, {
        parameterNames: parameters,
        filterFeatures: drawnShapes,
        from,
        to,
        paletteDefinition,
      });
    }

    let correctedPaletteDefinition = paletteDefinition;
    if (repalette && paletteDefinition) {
      correctedPaletteDefinition = {
        ...paletteDefinition,
        actualCount: paletteDefinition.originalCount,
      };

      const expression = await this.styleLayer(layer, paletteDefinition, { updateStore: false });
      if (expression) {
        _color = expression;

        if (expression.length !== paletteDefinition.originalCount * 2 + 3) {
          const newCount = (expression.length - 3) / 2;

          if (isValidColorBrewerIndex(newCount)) {
            correctedPaletteDefinition = {
              ...correctedPaletteDefinition,
              actualCount: newCount,
            };
            if (paletteDefinition.actualCount !== newCount) {
              this.deps.notificationManager.show(
                `Duplicate thresholds detected. Reducing to ${newCount} threshold(s)`,
                NotificationVariant.Info,
                5000
              );
            }
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
      bbox: currentBBox,
      loaded: true,
    });
  }
}

export default MainManager;
