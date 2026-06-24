/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import Map from '@/components/Map';
import { basemaps } from '@/components/Map/consts';
import { useMap } from '@/contexts/MapContexts';
import { MINI_MAP_ID } from '@/features/Compare/MiniMap/consts';
// import { MAP_ID } from '@/features/Map/config';
import { INITIAL_CENTER, INITIAL_ZOOM } from '@/features/Map/consts';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import useMainStore from '@/stores/main';
import { Layer, Location } from '@/stores/main/types';

type Props = {
  layers: Layer[];
  locations: Location[];
  layerLocationGroups: LayerLocationGroups;
};

const MiniMap: React.FC<Props> = (props) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { layerLocationGroups } = props;

  const basemap = useMainStore((state) => state.basemap);
  // const layers = useMainStore((state) => state.layers);

  // const [data, setData] = useState<TWrappedCoverage[]>([]);

  // const { map: mainMap } = useMap(MAP_ID);
  const { map } = useMap(MINI_MAP_ID);

  useEffect(() => {
    if (!map) {
      return;
    }

    map.fitBounds(
      [
        [-114.8183, 31.3322], // Southwest corner [lng, lat]
        [-109.0452, 37.0043], // Northeast corner [lng, lat]
      ],
      {
        padding: 10,
        animate: false,
      }
    );
  }, [map]);

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
