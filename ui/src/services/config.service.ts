/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Map as MapboxMap } from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import MainManager from '@/managers/main/Main.manager';
import { Config, GetConfigResponse, PostConfigResponse } from '@/managers/types';
import { FactoryService } from '@/services/factory.service';
import { MapService } from '@/services/map.service';
import { MainState } from '@/stores/main/types';

type ConfigServiceDependencies = {
  factoryService: FactoryService;
  mainManager: MainManager;
  mapService: MapService;
};

export class ConfigService {
  private store: UseBoundStore<StoreApi<MainState>>;
  private deps: ConfigServiceDependencies;
  private map: MapboxMap | null = null;
  private draw: MapboxDraw | null = null;

  constructor(store: UseBoundStore<StoreApi<MainState>>, deps: ConfigServiceDependencies) {
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
    const spatialSelection = this.store.getState().spatialSelection;
    const terrainActive = this.store.getState().terrainActive;

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
      spatialSelection,
      terrainActive,
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
      headers: {
        'Access-Control-Request-Headers': 'location', // Specify that we need the request header
      },
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
    store.setSpatialSelection(config.spatialSelection);
    store.setTerrainActive(config.terrainActive);

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
            const sourceId = this.deps.factoryService.getSourceId(layer.datasourceId, layer.id);
            this.deps.mapService.addSource(layer.datasourceId, layer.id);
            this.deps.mapService.addLayer(layer, sourceId);

            // Use applySpatialFilter, this will factor in drawn shapes but fallback
            // to addData if none exists
            dataFetches.push(this.deps.mainManager.applySpatialFilter(config.drawnShapes));
          }

          // Fetch concurrently
          await Promise.all(dataFetches);

          // Set locations after layers are present so the map can reflect selected state
          store.setLocations(config.locations);

          // Assert layer order
          this.deps.mainManager.reorderLayers();

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
}
