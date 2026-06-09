/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { combine, featureCollection, simplify } from '@turf/turf';
import { Feature, MultiPolygon, Polygon } from 'geojson';
import { GeoJSONSource } from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import { getDefaultGeoJSON } from '@/consts/geojson';
import { SourceId } from '@/features/Map/sources';
import { ARIZONA_ID, LOWER_COLORADO_ID, UPPER_COLORADO_ID } from '@/hooks/useSpatialSelection';
import { getNextLink } from '@/managers/main/Main.utils';
import NotificationManager from '@/managers/Notification.manager';
import { SourceOptions } from '@/managers/types';
import { CollectionService } from '@/services/collection.service';
import { ICollection } from '@/services/edr.service';
import { FactoryService } from '@/services/factory.service';
import { FetchService } from '@/services/fetch.service';
import { LocationService } from '@/services/location.service';
import { MapService } from '@/services/map.service';
import { SpatialService } from '@/services/spatial.service';
import { ValidationService } from '@/services/validation.service';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { Layer, MainState, PredefinedBoundary, TGeometryTypes } from '@/stores/main/types';
import { NotificationVariant } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { joinSentence } from '@/utils/joinSentence';

type DataServiceDependencies = {
  collectionService: CollectionService;
  factoryService: FactoryService;
  fetchService: FetchService;
  locationService: LocationService;
  mapService: MapService;
  notificationManager: NotificationManager;
  spatialService: SpatialService;
  validationService: ValidationService;
};

export class DataService {
  private store: UseBoundStore<StoreApi<MainState>>;
  private deps: DataServiceDependencies;

  constructor(store: UseBoundStore<StoreApi<MainState>>, deps: DataServiceDependencies) {
    this.store = store;
    this.deps = deps;
  }

  public async addData(collectionId: ICollection['id'], layer: Layer, options?: SourceOptions) {
    const datasource = this.deps.collectionService.getDatasource(collectionId);

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

    return layer.id;
  }

  private getNoDataMessage(
    name: string,
    parameterCount: number,
    collectionId: ICollection['id']
  ): string {
    const datasource = this.deps.collectionService.getDatasource(collectionId);
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
    const sourceId = this.deps.factoryService.getSourceId(collectionId, layer.id);

    const source = this.deps.mapService.getMapSource<GeoJSONSource>(sourceId);

    if (options?.noFetch || !source) {
      return sourceId;
    }

    const bbox = this.deps.spatialService.getBBox(collectionId);
    const from = options?.from ?? layer.from;
    const to = options?.to ?? layer.to;
    const parameters = options?.parameterNames ?? layer.parameters;

    const geometryTypes = new Set<TGeometryTypes>();

    this.deps.validationService.checkDateRestrictions(collectionId, from, to);

    this.deps.validationService.checkParameterRestrictions(collectionId, parameters);

    let aggregate = getDefaultGeoJSON();
    let next: string | undefined;

    do {
      if (options?.signal?.aborted) {
        break;
      }

      const page = await this.deps.fetchService.fetchData(
        collectionId,
        bbox,
        from,
        to,
        parameters,
        options?.signal,
        next
      );

      const spatialSelection = this.store.getState().spatialSelection;
      let filter = options?.filterFeatures;

      const hasExplicitFilters = options?.filterFeatures && options.filterFeatures.length > 0;

      const shouldUseSpatialSelection =
        !hasExplicitFilters &&
        spatialSelection?.strict &&
        isSpatialSelectionPredefined(spatialSelection);

      if (shouldUseSpatialSelection) {
        const spatialSelectionCollection = this.deps.mapService.getMapFeatures<
          Polygon | MultiPolygon
        >(SourceId.SpatialSelection);

        if (spatialSelectionCollection) {
          const allowedIds =
            spatialSelection.boundary === PredefinedBoundary.Arizona
              ? [ARIZONA_ID]
              : [LOWER_COLORADO_ID, UPPER_COLORADO_ID];

          const selectedFeatures = spatialSelectionCollection.features.filter((feature) =>
            allowedIds.includes(String(feature.id))
          );

          const combinedFeatures = combine(featureCollection(selectedFeatures)).features as Feature<
            Polygon | MultiPolygon
          >[];

          const toleranceFactor =
            spatialSelection.boundary === PredefinedBoundary.Arizona ? 0.005 : 0.05;

          filter = combinedFeatures.map((feature) =>
            simplify(feature, {
              tolerance: toleranceFactor,
              mutate: true,
            })
          );
        }
      }

      let filtered = this.deps.spatialService.filterLocations(collectionId, page, filter);
      this.deps.locationService.clearInvalidLocations(layer.id, collectionId, filtered);
      if (Array.isArray(filtered.features)) {
        filtered.features.forEach((feature) => {
          geometryTypes.add(feature.geometry.type);
        });
        aggregate.features.push(...filtered.features);
        source.setData(aggregate);
      }

      (filtered as any) = undefined;
      next = getNextLink(page);
    } while (next);

    if (aggregate.features.length === 0) {
      const message = this.getNoDataMessage(layer.name, parameters.length, collectionId);

      this.deps.notificationManager.show(message, NotificationVariant.Info, 10000);
    }

    (aggregate as any) = undefined;

    this.store.getState().updateLayer({
      ...layer,
      loaded: true,
      geometryTypes: Array.from(geometryTypes),
    });

    return sourceId;
  }
}
