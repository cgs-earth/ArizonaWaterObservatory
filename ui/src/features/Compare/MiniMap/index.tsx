/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { featureCollection } from '@turf/turf';
import { GeoJSONSource, LngLatBoundsLike, LngLatLike } from 'mapbox-gl';
import Map from '@/components/Map';
import { basemaps } from '@/components/Map/consts';
import { getBBox } from '@/consts/bbox';
import { StringIdentifierCollections } from '@/consts/collections';
import { useMap } from '@/contexts/MapContexts';
import { MINI_MAP_ID } from '@/features/Compare/MiniMap/consts';
import { DEFAULT_FILL_OPACITY, INITIAL_CENTER, INITIAL_ZOOM } from '@/features/Map/consts';
import { getId } from '@/features/Panel/Layers/Layer/Search/utils';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import { collectionService, factoryService, miniMapService } from '@/services/init';
import useMainStore from '@/stores/main';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { Layer, Location } from '@/stores/main/types';
import { TSimplifiedEntry } from '../types';

type Props = {
  layers: Layer[];
  layerEntries: TSimplifiedEntry[];
  locations: Location[];
  layerLocationGroups: LayerLocationGroups;
};

const DEFAULT_BOUNDS: [LngLatLike, LngLatLike] = [
  [-114.8183, 31.3322], // Southwest corner [lng, lat]
  [-109.0452, 37.0043], // Northeast corner [lng, lat]
];

const MiniMap: React.FC<Props> = (props) => {
  const { layers, layerLocationGroups, layerEntries } = props;

  const basemap = useMainStore((state) => state.basemap);
  const spatialSelection = useMainStore((state) => state.spatialSelection);

  const { map } = useMap(MINI_MAP_ID);

  useEffect(() => {
    if (!map) {
      return;
    }

    miniMapService.setMap(map);

    map.fitBounds(DEFAULT_BOUNDS, {
      padding: 10,
      animate: false,
    });
  }, [map]);

  useEffect(() => {
    if (!spatialSelection || !map) {
      return;
    }

    if (isSpatialSelectionPredefined(spatialSelection)) {
      const { boundary } = spatialSelection;

      const bbox = getBBox(boundary) as LngLatBoundsLike;

      map.fitBounds(bbox, { padding: 40 });
    }
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    for (const layer of layers) {
      const sourceId = factoryService.getSourceId(layer.datasourceId, layer.id);

      miniMapService.addSource(layer.datasourceId, layer.id);
      miniMapService.addLayer(layer, sourceId);

      // Clear data from last compare tool use
      const source = map.getSource<GeoJSONSource>(sourceId);
      if (source) {
        source.setData(featureCollection([]));
      }

      const { pointLayerId, lineLayerId, fillLayerId } = factoryService.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      // Update to latest settings
      if (map.getLayer(pointLayerId)) {
        map.setPaintProperty(pointLayerId, 'circle-color', layer.color);
      }
      if (map.getLayer(fillLayerId)) {
        map.setPaintProperty(fillLayerId, 'fill-color', layer.color);
        let fillOpacity = layer.opacity;
        fillOpacity = Math.max(0, layer.opacity * DEFAULT_FILL_OPACITY);
        map.setPaintProperty(fillLayerId, 'fill-opacity', fillOpacity);
      }
      if (map.getLayer(lineLayerId)) {
        map.setPaintProperty(lineLayerId, 'line-color', layer.color);
        map.setPaintProperty(lineLayerId, 'line-opacity', layer.opacity);
      }
    }
  }, [map, layers]);

  useEffect(() => {
    if (!map) {
      return;
    }

    for (const entry of layerEntries) {
      const group = layerLocationGroups[entry.layer.id];

      if (group) {
        const { selectedFeatures, otherFeatures } = group;

        const isStringIdentifierCollection = StringIdentifierCollections.includes(
          entry.layer.datasourceId
        );

        const allLocations = [...selectedFeatures, ...otherFeatures].filter((feature) =>
          entry.locations.includes(getId(feature, isStringIdentifierCollection))
        );

        const layer = collectionService.getLayer(entry.layer.id);
        if (layer) {
          const sourceId = factoryService.getSourceId(layer.datasourceId, layer.id);
          const source = map.getSource<GeoJSONSource>(sourceId);

          if (source) {
            const sourceFeatureCollection = featureCollection(allLocations);
            source.setData(sourceFeatureCollection);
          }
        }
      }
    }
  }, [layerLocationGroups, layerEntries]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const prevStyle = map.getStyle();

    if (prevStyle) {
      // TODO: determine what specifiers to use
      const customLayers = (prevStyle.layers || []).filter(
        (layer) =>
          layer.id.startsWith('user-') ||
          layer.id.startsWith('spatial-selection') ||
          layer.id.startsWith('measure') ||
          layer.id.startsWith('terrain')
      );

      const customSources = Object.entries(prevStyle.sources || {}).filter(
        ([id]) =>
          id.startsWith('user-') ||
          id.startsWith('spatial-selection') ||
          id.startsWith('measure') ||
          id.startsWith('terrain')
      );

      // Copy over all existing layers and sources when changing basemaps
      map.once('styledata', () => {
        for (const [id, source] of customSources) {
          if (!map.getSource(id)) {
            map.addSource(id, source);
          }
        }

        for (const layer of customLayers) {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer);
          }
        }
      });

      map.setStyle(basemaps[basemap]);
    }
  }, [basemap]);

  return (
    <Map
      accessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
      id={MINI_MAP_ID}
      persist
      sources={[]}
      layers={[]}
      options={{
        interactive: false,
        style: basemaps[basemap],
        projection: 'mercator',
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
        maxZoom: 20,
      }}
      controls={{
        scaleControl: true,
      }}
    />
  );
};

export default MiniMap;
