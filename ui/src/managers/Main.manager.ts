/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import * as turf from '@turf/turf';
import { Feature, FeatureCollection, Geometry, Point, Polygon } from 'geojson';
import { GeoJSONFeature, GeoJSONSource, Map, Popup } from 'mapbox-gl';
import { v6 } from 'uuid';
import { StoreApi, UseBoundStore } from 'zustand';
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
    return getRandomHexColor();
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
    signal?: AbortSignal
  ): Promise<FeatureCollection<Point>> {
    return awoService.getLocations<FeatureCollection<Point>>(collectionId, { signal });
  }

  public getDatasourceCount = (datasourceId: ICollection['id']): number => {
    return this.store.getState().layers.filter((layer) => layer.datasourceId === datasourceId)
      .length;
  };

  public getDatasource = (datasourceId: ICollection['id']): ICollection | undefined => {
    return this.store.getState().collections.find((datasource) => datasource.id === datasourceId);
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

    const sourceId = await this.addLocationSource(datasource.id, signal);
    this.addLocationLayer(layer, sourceId);

    this.store.getState().addLayer(layer);
  }

  deleteLayer(layerId: Layer['id']) {
    const charts = this.store.getState().charts.filter((chart) => chart.layer !== layerId);
    const layers = this.store.getState().layers.filter((layer) => layer.id !== layerId);

    this.store.getState().setCharts(charts);
    this.store.getState().setLayers(layers);
  }

  /**
   *
   * @function
   */
  public getSourceId(collectionId: ICollection['id']): string {
    return `${collectionId}-source`;
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
      pointLayerId: `${collectionId}-${layerId}-edr-locations-point`,
      fillLayerId: `${collectionId}-${layerId}-edr-locations-fill`,
      lineLayerId: `${collectionId}-${layerId}-edr-locations-line`,
    };
  }

  public getFilterLayerId(collectionId: ICollection['id']): string {
    return `${collectionId}-filter`;
  }

  private filterByGeometryType(
    featureCollection: FeatureCollection<Geometry>,
    geographyFilterFeature: Feature<Polygon>
  ): FeatureCollection<Geometry> {
    return {
      type: 'FeatureCollection',
      features: featureCollection.features.filter((feature) => {
        switch (feature.geometry.type) {
          case 'Point':
            return turf.booleanPointInPolygon(feature as Feature<Point>, geographyFilterFeature);

          case 'LineString':
          case 'MultiLineString':
          case 'Polygon':
          case 'MultiPolygon':
            return turf.booleanIntersects(feature, geographyFilterFeature);

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

  private filterLocations(
    featureCollection: FeatureCollection<Geometry>
  ): FeatureCollection<Geometry> {
    const geographyFilter = this.store.getState().geographyFilter;

    if (geographyFilter) {
      return this.filterByGeometryType(featureCollection, geographyFilter.feature);
    }

    return featureCollection;
  }

  /**
   *
   * @function
   */
  private async addLocationSource(
    collectionId: ICollection['id'],
    signal?: AbortSignal
  ): Promise<string> {
    const sourceId = this.getSourceId(collectionId);
    if (this.map) {
      const source = this.map.getSource(sourceId) as GeoJSONSource;
      if (!source) {
        const data = await this.fetchLocations(collectionId, signal);

        this.map.addSource(sourceId, {
          type: 'geojson',
          data,
        });
      }
    }

    return sourceId;
  }

  private getUniqueIds(features: GeoJSONFeature[]): Array<string | number> {
    const uniques = new Set<string | number>();

    for (const feature of features) {
      if (feature.id) {
        uniques.add(feature.id);
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
      layer.id,
      layer.datasourceId
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
                this.store.getState().removeLocation(locationId);
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
                  this.store.getState().removeLocation(locationId);
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
                  this.store.getState().removeLocation(locationId);
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
