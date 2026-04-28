/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { LngLatBoundsLike } from 'mapbox-gl';
import Button from '@/components/Button';
import { BasemapId } from '@/components/Map/types';
import { Variant } from '@/components/types';
import { getBBox } from '@/consts/bbox';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';

export const ClearAll: React.FC = () => {
  const setBasemap = useMainStore((state) => state.setBasemap);
  const spatialSelection = useMainStore((state) => state.spatialSelection);

  const hasLayers = useMainStore((state) => state.layers.length > 0);

  const { map, draw } = useMap(MAP_ID);

  const handleClick = () => {
    mainManager.clearAllData();

    if (map) {
      map.resize();

      if (spatialSelection && isSpatialSelectionPredefined(spatialSelection)) {
        const { boundary } = spatialSelection;

        const bbox = getBBox(boundary) as LngLatBoundsLike;

        map.fitBounds(bbox, { padding: 40 });
      }
      setBasemap(BasemapId.Streets);
    }

    if (draw) {
      draw.trash();
      draw.deleteAll();
      draw.changeMode('simple_select');
    }
  };

  return (
    <Button
      ml="var(--default-spacing)"
      mr="auto"
      size="sm"
      disabled={!hasLayers}
      data-disabled={!hasLayers}
      variant={Variant.Primary}
      onClick={handleClick}
    >
      Clear All
    </Button>
  );
};
