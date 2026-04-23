/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { MapMouseEvent, Marker } from 'mapbox-gl';
import { useMediaQuery } from '@mantine/hooks';
import Map from '@/components/Map';
import { basemaps } from '@/components/Map/consts';
import { LayerType } from '@/components/Map/types';
import { useMap } from '@/contexts/MapContexts';
import { layerDefinitions, MAP_ID } from '@/features/Map/config';
import { DEFAULT_BBOX, drawLayers } from '@/features/Map/consts';
import { sourceConfigs, SourceId } from '@/features/Map/sources';
import { drawnFeatureContainsExtent, getSelectedColor, getSortKey } from '@/features/Map/utils';
import { showGraphPopup } from '@/features/Popup/utils';
import { useSpatialSelection } from '@/hooks/useSpatialSelection';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import useMainStore from '@/stores/main';
import { Location } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { groupLocationIdsByLayer } from '@/utils/groupLocationsByCollection';
import { isTopLayer } from '@/utils/isTopLayer';
import { getDefaultFilter, getFilter } from '@/utils/layerDefinitions';

const INITIAL_CENTER: [number, number] = [-98.5795, 39.8282];
const INITIAL_ZOOM = 4;

type Props = {
  accessToken: string;
};

/**
 * This component renders the main map for the application, allowing users to interact with all layers defined in config.tsx.
 * It handles all map events that interact with global state.
 *
 * Props:
 * - accessToken: string - The access token for the map service.
 *
 * @component
 */
const MainMap: React.FC<Props> = (props) => {
  const { accessToken } = props;

  const locations = useMainStore((state) => state.locations);
  const layers = useMainStore((state) => state.layers);
  const basemap = useMainStore((state) => state.basemap);
  const searches = useMainStore((state) => state.searches);
  const terrainActive = useMainStore((state) => state.terrainActive);
  const setTerrainActive = useMainStore((state) => state.setTerrainActive);

  const loadingInstances = useSessionStore((state) => state.loadingInstances);

  const [shouldResize, setShouldResize] = useState(false);

  const [layerPopupListeners, setLayerPopupListeners] = useState<Record<string, boolean>>({});

  const { map, geocoder, hoverPopup, persistentPopup, draw, root, container } = useMap(MAP_ID);

  const isMounted = useRef(true);
  const initialMapLoad = useRef(true);

  const mobile = useMediaQuery('(max-width: 899px)');

  useSpatialSelection(map);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    map.on('mousedown', () => {
      if (
        window &&
        window.getSelection &&
        window.getSelection() &&
        window.getSelection()?.removeAllRanges
      ) {
        window.getSelection()!.removeAllRanges();
      }
    });

    if (initialMapLoad.current) {
      initialMapLoad.current = false;
      mainManager.setMap(map);
      map.resize();
      map.fitBounds(
        [
          [-114.8183, 31.3322], // Southwest corner [lng, lat]
          [-109.0452, 37.0043], // Northeast corner [lng, lat]
        ],
        {
          padding: 50,
          animate: false,
        }
      );

      if (!mobile) {
        setTerrainActive(true);
      }
    }
  }, [map]);

  useEffect(() => {
    if (!hoverPopup) {
      return;
    }

    mainManager.setHoverPopup(hoverPopup);
  }, [hoverPopup]);

  useEffect(() => {
    if (!persistentPopup) {
      return;
    }

    mainManager.setPersistentPopup(persistentPopup);
  }, [persistentPopup]);

  useEffect(() => {
    if (!container) {
      return;
    }

    mainManager.setContainer(container);
  }, [container]);

  useEffect(() => {
    if (!draw) {
      return;
    }

    mainManager.setDraw(draw);
  }, [draw]);

  useEffect(() => {
    setShouldResize(loadingInstances.length > 0);
  }, [loadingInstances]);

  useEffect(() => {
    if (!map) {
      return;
    }

    map.resize();
  }, [shouldResize]);

  useEffect(() => {
    if (!map || !persistentPopup || !hoverPopup || !root || !container || !draw) {
      return;
    }

    const allIds: string[] = [];
    layers.forEach((layer) => {
      const { pointLayerId, lineLayerId, fillLayerId } = mainManager.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      allIds.push(pointLayerId);
      allIds.push(lineLayerId);
      allIds.push(fillLayerId);
      if (!layerPopupListeners[layer.id]) {
        map.on('dblclick', [pointLayerId, lineLayerId, fillLayerId], (e) => {
          const drawnFeatures = map.queryRenderedFeatures(e.point, { layers: drawLayers });

          // Check if the edges of the drawn feature are visible
          const drawnFeature = drawnFeatures[0];

          const includeDrawLayers =
            drawnFeatures.length > 0 && !drawnFeatureContainsExtent(drawnFeature, draw, map);

          if (!isTopLayer(layer.id, layer.datasourceId, map, e.point, includeDrawLayers)) {
            return;
          }

          const features = e.features;
          if (features && features.length > 0) {
            hoverPopup.remove();

            const uniqueFeatures = mainManager.getUniqueIds(features, layer.id);
            const locations: Location[] = uniqueFeatures.map(({ id }) => ({
              id,
              layerId: layer.id,
            }));

            locations.forEach((location) => useMainStore.getState().addLocation(location));

            showGraphPopup(layer.id, locations, map, e, root, container, persistentPopup);
          }
        });

        setLayerPopupListeners({
          ...layerPopupListeners,
          [layer.id]: true,
        });
      }
    });
  }, [layers]);

  useEffect(() => {
    if (!map) {
      return;
    }

    layers.forEach((layer) => {
      const { pointLayerId, lineLayerId, fillLayerId } = mainManager.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );
      const search = searches.find((search) => search.layerId === layer.id);

      if (!search) {
        if (map.getFilter(pointLayerId)) {
          map.setFilter(pointLayerId, getDefaultFilter(LayerType.Circle));
        }
        if (map.getFilter(lineLayerId)) {
          map.setFilter(lineLayerId, getDefaultFilter(LayerType.Line));
        }
        if (map.getFilter(fillLayerId)) {
          map.setFilter(fillLayerId, getDefaultFilter(LayerType.Fill));
        }

        return;
      }

      map.setFilter(pointLayerId, getFilter(search.matchedLocations, LayerType.Circle));
      map.setFilter(lineLayerId, getFilter(search.matchedLocations, LayerType.Line));
      map.setFilter(fillLayerId, getFilter(search.matchedLocations, LayerType.Fill));
    });
  }, [searches]);

  useEffect(() => {
    if (!map || !draw) {
      return;
    }

    const allIds: string[] = [];
    layers.forEach((layer) => {
      const { pointLayerId, lineLayerId, fillLayerId } = mainManager.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      if (map.getLayer(pointLayerId)) {
        allIds.push(pointLayerId);
      }
      if (map.getLayer(lineLayerId)) {
        allIds.push(lineLayerId);
      }
      if (map.getLayer(fillLayerId)) {
        allIds.push(fillLayerId);
      }
    });

    // Simple blocker to prevent draw layer selection through other features
    const blockDrawEvents = (e: MapMouseEvent) => {
      // const features = map.queryRenderedFeatures(e.point, { layers: allIds });
      const drawnFeatures = map.queryRenderedFeatures(e.point, { layers: drawLayers });

      // Check if the edges of the drawn feature are visible
      const drawnFeature = drawnFeatures[0];
      if (drawnFeatureContainsExtent(drawnFeature, draw, map)) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
        draw.changeMode('simple_select', { featureIds: [] });
      }

      // if (features.length) {
      //   e.originalEvent.preventDefault();
      //   e.originalEvent.stopPropagation();
      //   draw.changeMode('simple_select', { featureIds: [] });
      // }
    };

    map.on('mousedown', drawLayers, blockDrawEvents);
    map.on('click', drawLayers, blockDrawEvents);

    return () => {
      map.off('mousedown', drawLayers, blockDrawEvents);
      map.off('click', drawLayers, blockDrawEvents);
    };
  }, [draw, layers]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const locationsByCollection = groupLocationIdsByLayer(locations);
    layers.forEach((layer) => {
      const locationIds = locationsByCollection[layer.id] ?? [];
      const { pointLayerId, lineLayerId } = mainManager.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      let color;
      if (map.getLayer(pointLayerId)) {
        color = map.getPaintProperty(pointLayerId, 'circle-color') as string;
        map.setPaintProperty(pointLayerId, 'circle-stroke-color', getSelectedColor(locationIds));
      }
      if (map.getLayer(lineLayerId)) {
        map.setPaintProperty(lineLayerId, 'line-color', getSelectedColor(locationIds, color));
        map.setLayoutProperty(lineLayerId, 'line-sort-key', getSortKey(locationIds));
      }
    });
  }, [locations, layers]);

  useEffect(() => {
    if (!geocoder || !map) {
      return;
    }

    let marker: Marker;
    geocoder.on('result', async (e) => {
      if (marker) {
        marker.remove();
      }

      const result: MapboxGeocoder.Result = e.result;
      const center = result.center as [number, number];

      marker = new Marker().setLngLat(center).addTo(map);

      map.flyTo({
        center,
        zoom: 10,
      });
    });

    geocoder.on('clear', () => {
      if (marker) {
        marker.remove();
      }
    });

    return () => {
      if (marker) {
        marker.remove();
      }
    };
  }, [map, geocoder]);

  useEffect(() => {
    if (!map) {
      return;
    }

    if (terrainActive) {
      notificationManager.show('3D Terrain active.');
      map.setTerrain({ source: SourceId.Terrain });
    } else {
      notificationManager.show('3D Terrain disabled.');
      map.setTerrain(null);
    }
  }, [terrainActive]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const prevStyle = map.getStyle();

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

      const terrainActive = useMainStore.getState().terrainActive;
      if (terrainActive) {
        map.setTerrain({ source: SourceId.Terrain });
      }
    });

    map.setStyle(basemaps[basemap]);
  }, [basemap]);

  return (
    <>
      <Map
        accessToken={accessToken}
        id={MAP_ID}
        sources={sourceConfigs}
        layers={layerDefinitions}
        options={{
          style: basemaps[basemap],
          projection: 'mercator',
          center: INITIAL_CENTER,
          zoom: INITIAL_ZOOM,
          maxZoom: 20,
        }}
        controls={{
          scaleControl: true,
          navigationControl: true,
        }}
        draw={{ clickBuffer: 5, touchEnabled: true, displayControlsDefault: false }}
        geocoder={{
          bbox: DEFAULT_BBOX, // limit to Arizona
          countries: 'us', // exclude non-US cities in bbox
          placeholder: 'Search for a location',
          flyTo: false,
          trackProximity: false,
          filter: (item) => {
            return item.place_name.toLowerCase().includes('arizona');
          },
        }}
        eventHandlers={{
          doubleClickZoom: false,
        }}
      />
    </>
  );
};

export default MainMap;
