/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Marker } from 'mapbox-gl';
import Map from '@/components/Map';
import { basemaps } from '@/components/Map/consts';
import { useMap } from '@/contexts/MapContexts';
import { layerDefinitions, MAP_ID } from '@/features/Map/config';
import { DEFAULT_BBOX } from '@/features/Map/consts';
import { sourceConfigs } from '@/features/Map/sources';
import { getSelectedColor, getSortKey } from '@/features/Map/utils';
import { showGraphPopup } from '@/features/Popup/utils';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Location } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { groupLocationIdsByLayer } from '@/utils/groupLocationsByCollection';

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

  const loadingInstances = useSessionStore((state) => state.loadingInstances);

  const [shouldResize, setShouldResize] = useState(false);

  const { map, geocoder, hoverPopup, persistentPopup, draw, root, container } = useMap(MAP_ID);

  const isMounted = useRef(true);
  const initialMapLoad = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!map) {
      return;
    }

    mainManager.setMap(map);

    if (initialMapLoad.current) {
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
      initialMapLoad.current = false;
    }
  }, [map]);

  useEffect(() => {
    if (!hoverPopup) {
      return;
    }

    mainManager.setPopup(hoverPopup);
  }, [hoverPopup]);

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
    if (!map || !persistentPopup || !hoverPopup || !root || !container) {
      return;
    }

    layers.forEach((layer) => {
      const { pointLayerId, lineLayerId, fillLayerId } = mainManager.getLocationsLayerIds(
        layer.datasourceId,
        layer.id
      );

      map.on('dblclick', [pointLayerId, lineLayerId, fillLayerId], (e) => {
        const features = e.features;
        if (features && features.length > 0) {
          hoverPopup.remove();

          const uniqueFeatures = mainManager.getUniqueIds(features);
          const locations: Location[] = uniqueFeatures.map((id) => ({
            id,
            layerId: layer.id,
          }));

          locations.forEach((location) => useMainStore.getState().addLocation(location));

          showGraphPopup(locations, map, e, root, container, persistentPopup);
        }
      });
    });
  }, [layers]);

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
  }, [locations]);

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

    // Copy over all existing layers and sources when changing basemaps
    const layers = map.getStyle().layers || [];
    const sources = map.getStyle().sources || {};

    const customLayers = layers.filter((layer) => {
      return layer.id.startsWith('user-');
    });

    const customSources = Object.entries(sources).filter(([id]) => {
      return id.startsWith('user-');
    });

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
