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
  Popup,
  RasterTileSource,
  Source,
} from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import { getDefaultGeoJSON } from '@/consts/geojson';
import {
  DEFAULT_BBOX,
  drawLayers,
  LAYER_IDENTIFIER,
  LOCATION_IDENTIFIER,
} from '@/features/Map/consts';
import { drawnFeatureContainsExtent } from '@/features/Map/utils';
import { ICollection } from '@/services/edr.service';
import { collectionService, factoryService, locationService } from '@/services/init';
import { Layer, Location, MainState } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { isTopLayer } from '@/utils/isTopLayer';
import {
  getFillLayerDefinition,
  getLineLayerDefinition,
  getPointLayerDefinition,
  getRasterLayerSpecification,
} from '@/utils/layerDefinitions';

export class MapService {
  private store: UseBoundStore<StoreApi<MainState>>;
  private map: MapboxMap | null = null;
  private hoverPopup: Popup | null = null;
  private persistentPopup: Popup | null = null;
  private container: HTMLDivElement | null = null;
  private draw: MapboxDraw | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>) {
    this.store = store;
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
   * Setter function to set hoverPopup private variable after map initialization
   *
   * @function
   */
  public setHoverPopup(popup: Popup): void {
    if (!this.hoverPopup) {
      this.hoverPopup = popup;
    }
  }
  /**
   * Setter function to set container private variable after map initialization
   *
   * @function
   */
  public setPersistentPopup(popup: Popup): void {
    if (!this.persistentPopup) {
      this.persistentPopup = popup;
    }
  }

  /**
   * Setter function to set container private variable after map initialization
   *
   * @function
   */
  public setContainer(container: HTMLDivElement): void {
    if (!this.container) {
      this.container = container;
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

  public clearStalePopup(evaluate: (layerId: Layer['id'], locationId: Location['id']) => boolean) {
    if (this.container && this.persistentPopup) {
      const locationId = this.container.getAttribute(LOCATION_IDENTIFIER);
      const layerId = this.container.getAttribute(LAYER_IDENTIFIER);
      if (locationId && layerId && evaluate(layerId, locationId)) {
        this.persistentPopup.remove();
      }
    }
  }

  /**
   * Adds (or updates) a GeoJSON source and pages through all results,
   * streaming each page into the source as it arrives.
   */
  private addGeoJsonSource(collectionId: ICollection['id'], layerId: Layer['id']): string {
    const sourceId = factoryService.getSourceId(collectionId, layerId);

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
    const sourceId = factoryService.getSourceId(collection.id, layerId);
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
    const datasource = collectionService.getDatasource(collectionId);
    const sourceId = factoryService.getSourceId(collectionId, layerId);

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

  private addRasterLayer(layer: Layer, sourceId: string): void {
    const { rasterLayerId } = factoryService.getLocationsLayerIds(layer.datasourceId, layer.id);

    if (this.map && !this.map.getLayer(rasterLayerId)) {
      this.map.addLayer(getRasterLayerSpecification(rasterLayerId, sourceId));
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
          const uniqueFeatures = locationService.getUniqueIds(features, collectionId);

          uniqueFeatures.forEach(({ id }) => {
            if (collectionService.hasLocation(id)) {
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
      const layer = collectionService.getLayer(layerId);
      if (features && features.length > 0 && layer) {
        const uniqueFeatures = locationService
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

    const { pointLayerId, fillLayerId, lineLayerId } = factoryService.getLocationsLayerIds(
      layer.datasourceId,
      layer.id
    );
    if (this.map) {
      if (
        !this.map.getLayer(pointLayerId) &&
        !this.map.getLayer(lineLayerId) &&
        !this.map.getLayer(pointLayerId)
      ) {
        const { upperLabel, lowerLabel } = factoryService.getLabels(collectionType);

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
          this.hoverPopup!.remove();
        });
      }
      if (geographyFilter) {
        const geoFilterLayerId = factoryService.getFilterLayerId(geographyFilter.collectionId);
        [fillLayerId, lineLayerId, pointLayerId].forEach((layerId) =>
          this.map!.moveLayer(geoFilterLayerId, layerId)
        );
      }

      drawLayers.forEach((layerId) => {
        this.map!.moveLayer(layerId);
      });
    }
  }

  public clearLayers(): void {
    if (!this.map) {
      return;
    }

    const layers = this.store.getState().layers;

    for (const layer of layers) {
      const layerIds = Object.values(
        factoryService.getLocationsLayerIds(layer.datasourceId, layer.id)
      );
      for (const layerId of layerIds) {
        if (this.map.getLayer(layerId)) {
          this.map.removeLayer(layerId);
        }
      }
    }
    if (this.container && this.persistentPopup) {
      const locationId = this.container.getAttribute(LOCATION_IDENTIFIER);
      const layerId = this.container.getAttribute(LAYER_IDENTIFIER);
      if (locationId && layerId) {
        this.persistentPopup.remove();
      }
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
        const sourceId = factoryService.getSourceId(collection.id, layer.id);
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

    const data = source._data;
    if (typeof data !== 'string') {
      const featureCollection = turf.featureCollection<T, V>(
        (data as FeatureCollection<T, V>).features as Feature<T, V>[]
      );

      return featureCollection;
    }
  }

  public addLayer(layer: Layer, sourceId: string): void {
    const datasource = collectionService.getDatasource(layer.datasourceId);

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
}
