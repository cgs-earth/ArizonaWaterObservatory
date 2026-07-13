/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import {
  GeoJSONSource,
  Map as MapboxMap,
  MapMouseEvent,
  MapTouchEvent,
  RasterTileSource,
  Source,
} from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { DEFAULT_BBOX, drawLayers } from '@/features/Map/consts';
import { drawnFeatureContainsExtent } from '@/features/Map/utils';
import { CollectionService } from '@/services/collection.service';
import { ICollection } from '@/services/edr.service';
import { FactoryService } from '@/services/factory.service';
import { LocationService } from '@/services/location.service';
import { PopupService } from '@/services/popup.service';
import { Layer, MainState } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { isTopLayer } from '@/utils/isTopLayer';
import {
  getFillLayerDefinition,
  getLineLayerDefinition,
  getPointLayerDefinition,
  getRasterLayerSpecification,
} from '@/utils/layerDefinitions';

type MapServiceDependencies = {
  collectionService: CollectionService;
  factoryService: FactoryService;
  locationService: LocationService;
  popupService?: PopupService;
};

type AddLayerOptions = {
  includeEvents?: boolean;
};

export class MapService {
  private store: UseBoundStore<StoreApi<MainState>>;
  private deps: MapServiceDependencies;
  private map: MapboxMap | null = null;
  private draw: MapboxDraw | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>, deps: MapServiceDependencies) {
    this.store = store;
    this.deps = deps;
  }

  /**
   * Setter function to set map private variable after map initialization
   *
   * @function
   */
  public setMap(map: MapboxMap): void {
    if (!this.map) {
      this.map = map;
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
   * Adds (or updates) a GeoJSON source and pages through all results,
   * streaming each page into the source as it arrives.
   */
  private addGeoJsonSource(collectionId: ICollection['id'], layerId: Layer['id']): string {
    const sourceId = this.deps.factoryService.getSourceId(collectionId, layerId);

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
    const sourceId = this.deps.factoryService.getSourceId(collection.id, layerId);
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

  public addSource(collectionId: ICollection['id'], layerId: Layer['id']) {
    const datasource = this.deps.collectionService.getDatasource(collectionId);
    const sourceId = this.deps.factoryService.getSourceId(collectionId, layerId);

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
          const uniqueFeatures = this.deps.locationService.getUniqueIds(features, collectionId);

          uniqueFeatures.forEach(({ id }) => {
            if (this.deps.collectionService.hasLocation(id)) {
              this.store.getState().removeLocation({
                id,
                layerId,
              });
            } else {
              this.store.getState().addLocation({
                id,
                layerId,
              });
            }
          });
        }
      }
    };
  }

  private getHoverEventHandler(
    layerId: Layer['id'],
    collectionId: ICollection['id'],
    upperLabel: string,
    lowerLabel: string
  ): (e: MapMouseEvent) => void {
    return (e) => {
      if (!this.deps.popupService) {
        return;
      }

      const drawMode = this.store.getState().drawMode;

      const drawActive = drawMode !== null;

      const drawnFeatures = this.map!.queryRenderedFeatures(e.point, { layers: drawLayers });

      // Check if the edges of the drawn feature are visible
      const drawnFeature = drawnFeatures[0];

      const isWithinExtent =
        drawnFeatures.length > 0 &&
        !drawnFeatureContainsExtent(drawnFeature, this.draw!, this.map!);

      // This feature is inside of drawn feature and the drawn feature is fully within the map extent
      if (isWithinExtent) {
        return;
      }

      // As layers can be added in any order, and reordered, perform manual check to ensure popup shows
      // for top layer in visual order
      if (!isTopLayer(layerId, collectionId, this.map!, e.point)) {
        return;
      }

      if (drawActive) {
        return;
      }

      this.map!.getCanvas().style.cursor = 'pointer';
      const { features } = e;
      const layer = this.deps.collectionService.getLayer(layerId);
      if (features && features.length > 0 && layer && this.map) {
        const uniqueFeatures = this.deps.locationService
          .getUniqueIds(features, layerId)
          .map(({ label }) => label);
        const html = `
            <span style="color:black;">
              <strong>${layer.name}</strong><br/>
              ${uniqueFeatures.map((locationId) => `<strong>${upperLabel} Id: </strong>${locationId}`).join('<br/>')}
              <div style="margin-top: 16px;display:flex;flex-direction:column;justify-content:center;align-items:center">
                <p style="margin: 0;">Click to select the ${lowerLabel}.</p>
                <p style="margin: 0;">Double-click to preview.</p>
              </div>
            </span>
          `;
        this.deps.popupService.showHoverPopup(e.lngLat, html);
      }
    };
  }

  private addRasterLayer(layer: Layer, sourceId: string): void {
    const { rasterLayerId } = this.deps.factoryService.getLocationsLayerIds(
      layer.datasourceId,
      layer.id
    );

    if (this.map && !this.map.getLayer(rasterLayerId)) {
      this.map.addLayer(getRasterLayerSpecification(rasterLayerId, sourceId));
    }
  }

  /**
   *
   * @function
   */
  private addStandardLayer(
    layer: Layer,
    sourceId: string,
    collectionType: CollectionType,
    options: AddLayerOptions = {}
  ): void {
    const { includeEvents = true } = options;

    const geographyFilter = this.store.getState().geographyFilter;

    const { pointLayerId, fillLayerId, lineLayerId } =
      this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id);
    if (this.map) {
      if (
        !this.map.getLayer(pointLayerId) &&
        !this.map.getLayer(lineLayerId) &&
        !this.map.getLayer(pointLayerId)
      ) {
        const { upperLabel, lowerLabel } = this.deps.factoryService.getLabels(collectionType);

        this.map.addLayer(getFillLayerDefinition(fillLayerId, sourceId, layer.color));
        this.map.addLayer(getLineLayerDefinition(lineLayerId, sourceId, layer.color));
        this.map.addLayer(getPointLayerDefinition(pointLayerId, sourceId, layer.color));

        // Allow exclusion for things like the minimap
        if (includeEvents) {
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

          if (collectionType !== CollectionType.Map) {
            this.map.on(
              'mouseenter',
              [pointLayerId, fillLayerId, lineLayerId],
              this.getHoverEventHandler(layer.id, layer.datasourceId, upperLabel, lowerLabel)
            );
            this.map.on(
              'mousemove',
              [pointLayerId, fillLayerId, lineLayerId],
              this.getHoverEventHandler(layer.id, layer.datasourceId, upperLabel, lowerLabel)
            );
          }
          this.map.on('mouseleave', [pointLayerId, fillLayerId, lineLayerId], () => {
            this.map!.getCanvas().style.cursor = '';
            if (this.deps.popupService) {
              this.deps.popupService.removeHoverPopup();
            }
          });
        }
      }
      if (geographyFilter) {
        const geoFilterLayerId = this.deps.factoryService.getFilterLayerId(
          geographyFilter.collectionId
        );
        [fillLayerId, lineLayerId, pointLayerId].forEach((layerId) =>
          this.map!.moveLayer(geoFilterLayerId, layerId)
        );
      }

      if (this.draw) {
        drawLayers.forEach((layerId) => {
          this.map!.moveLayer(layerId);
        });
      }
    }
  }

  public addLayer(layer: Layer, sourceId: string, options: AddLayerOptions = {}): void {
    const datasource = this.deps.collectionService.getDatasource(layer.datasourceId);

    if (datasource) {
      const collectionType = getCollectionType(datasource);

      if (
        [CollectionType.EDR, CollectionType.Features, CollectionType.EDRGrid].includes(
          collectionType
        )
      ) {
        this.addStandardLayer(layer, sourceId, collectionType, options);
      } else if (collectionType === CollectionType.Map) {
        this.addRasterLayer(layer, sourceId);
      }
    }
  }

  public clearLayers(): void {
    if (!this.map) {
      return;
    }

    const layers = this.store.getState().layers;

    for (const layer of layers) {
      const layerIds = Object.values(
        this.deps.factoryService.getLocationsLayerIds(layer.datasourceId, layer.id)
      );
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }
    }

    if (this.deps.popupService) {
      // Force clear popup
      this.deps.popupService.clearStalePopup(() => true);
    }
  }

  public clearSources(): void {
    if (!this.map) {
      return;
    }

    const originalCollections = this.store.getState().originalCollections;
    const layers = this.store.getState().layers;

    for (const collection of originalCollections) {
      const collectionLayers = layers.filter((layer) => layer.datasourceId === collection.id);
      for (const layer of collectionLayers) {
        const sourceId = this.deps.factoryService.getSourceId(collection.id, layer.id);
        if (this.map.getSource(sourceId)) {
          this.map.removeSource(sourceId);
        }
      }
    }
  }

  public getMapSource<T extends Source = Source>(id: string): T | undefined {
    if (!this.map) {
      return;
    }

    return this.map.getSource<T>(id);
  }

  public getMapFeatures<
    T extends Geometry = Geometry,
    V extends GeoJsonProperties = GeoJsonProperties,
  >(sourceId: string): FeatureCollection<T, V> | undefined {
    const source = this.map?.getSource(sourceId) as GeoJSONSource;
    if (source) {
      const data = source._data;
      if (typeof data !== 'string') {
        const featureCollection = turf.featureCollection<T, V>(
          (data as FeatureCollection<T, V>).features as Feature<T, V>[]
        );

        return featureCollection;
      }
    }
  }
}
