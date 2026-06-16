/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureCollection, Geometry } from 'geojson';
import { GeoJSONFeature } from 'mapbox-gl';
import { StoreApi, UseBoundStore } from 'zustand';
import { StringIdentifierCollections } from '@/consts/collections';
import { CollectionService } from '@/services/collection.service';
import { ICollection } from '@/services/edr.service';
import { PopupService } from '@/services/popup.service';
import { Layer, MainState } from '@/stores/main/types';
import { isEdrGrid } from '@/utils/collection';
import { getIdStore } from '@/utils/getIdStore';
import { getLabel } from '@/utils/getLabel';

type LocationServiceDependencies = {
  collectionService: CollectionService;
  popupService: PopupService;
};

export class LocationService {
  private store: UseBoundStore<StoreApi<MainState>>;
  private deps: LocationServiceDependencies;

  constructor(store: UseBoundStore<StoreApi<MainState>>, deps: LocationServiceDependencies) {
    this.store = store;
    this.deps = deps;
  }

  public clearInvalidLocations = (
    layerId: Layer['id'],
    collectionId: ICollection['id'],
    featureCollection: FeatureCollection<Geometry>
  ) => {
    const datasource = this.deps.collectionService.getDatasource(collectionId);

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

      this.deps.popupService.clearStalePopup((layerId, locationId) =>
        invalidLocations.some(
          (location) => location.layerId === layerId && location.id === locationId
        )
      );

      invalidLocations.forEach((location) => removeLocation(location));
    }
  };

  public getUniqueIds(
    features: GeoJSONFeature[],
    layerId: Layer['id']
  ): Array<{ id: string; label: string }> {
    // Use a Map to maintain uniqueness by id while preserving the final display label.
    const uniques = new Map<string, string>();

    const { datasourceId, label } = this.deps.collectionService.getLayer(layerId) ?? {
      datasourceId: '',
      label: null as string | null,
    };
    const useIdStore = StringIdentifierCollections.includes(datasourceId);

    for (const feature of features) {
      const featureLabel = label ? getLabel(feature, label) : null;
      if (useIdStore) {
        const id = getIdStore(feature);
        if (id) {
          const idStr = String(id);
          const display = featureLabel ? `${featureLabel} (${idStr})` : idStr;
          if (!uniques.has(idStr)) {
            uniques.set(idStr, display);
          }
        } else {
          console.error(
            'Unable to find id store on layer from collection: ',
            datasourceId,
            ', feature: ',
            feature
          );
        }
      } else if (feature.id != null) {
        const idStr = String(feature.id);
        const display = featureLabel ? `${featureLabel} (${idStr})` : idStr;
        if (!uniques.has(idStr)) {
          uniques.set(idStr, display);
        }
      }
    }

    // Convert to array of { id, label } and sort by the display label
    return Array.from(uniques.entries())
      .map(([id, displayLabel]) => ({ id, label: displayLabel }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}
