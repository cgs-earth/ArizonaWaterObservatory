/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Button from '@/components/Button';
import { BasemapId } from '@/components/Map/types';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';

export const ClearAll: React.FC = () => {
  const setBasemap = useMainStore((state) => state.setBasemap);
  const { map, draw } = useMap(MAP_ID);

  const handleClick = () => {
    mainManager.clearAllData();

    if (map) {
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
      variant={Variant.Primary}
      onClick={handleClick}
    >
      Clear All
    </Button>
  );
};
