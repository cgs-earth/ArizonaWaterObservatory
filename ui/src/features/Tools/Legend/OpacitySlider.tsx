/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Slider } from '@mantine/core';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import { DEFAULT_OPACITY } from '@/features/Map/consts';
import mainManager from '@/managers/Main.init';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};

export const OpacitySlider: React.FC<Props> = (props) => {
  const { layer } = props;

  const { map } = useMap(MAP_ID);

  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);

  useEffect(() => {
    if (!map) {
      return;
    }

    const { rasterLayerId } = mainManager.getLocationsLayerIds(layer.datasourceId, layer.id);
    if (map.getLayer(rasterLayerId)) {
      const opacity = map.getPaintProperty(rasterLayerId, 'raster-opacity');
      if (opacity && typeof opacity === 'number') {
        setOpacity(opacity);
      }
    }
  }, [map]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const { rasterLayerId } = mainManager.getLocationsLayerIds(layer.datasourceId, layer.id);

    if (map.getLayer(rasterLayerId)) {
      map.setPaintProperty(rasterLayerId, 'raster-opacity', opacity);
    }
  }, [opacity]);

  return (
    <Slider
      min={0}
      max={1}
      step={0.05}
      value={opacity}
      onChange={setOpacity}
      label={(value) => `${Math.round(value * 100)}%`}
    />
  );
};
