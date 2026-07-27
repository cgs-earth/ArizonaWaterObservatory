/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Box } from '@mantine/core';
import Accordion from '@/components/Accordion';
import Collapsible from '@/components/Collapsible';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import styles from '@/features/Compare/Compare.module.css';
import MiniMap from '@/features/Compare/MiniMap';
import { MINI_MAP_ID } from '@/features/Compare/MiniMap/consts';
import { Layer } from '@/features/Compare/Panel/Layer';
import { TSimplifiedEntry } from '@/features/Compare/types';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import { Layer as LayerType, Location } from '@/stores/main/types';

type Props = {
  layers: LayerType[];
  locations: Location[];
  layerLocationGroups: LayerLocationGroups;
  layerEntries: TSimplifiedEntry[];
  onLocationAdd: (location: Location) => void;
  onLocationRemove: (location: Location) => void;
  onOpen: () => void;
  onClose: () => void;
};

const Panel: React.FC<Props> = (props) => {
  const {
    layers,
    locations,
    layerEntries,
    layerLocationGroups,
    onLocationAdd,
    onLocationRemove,
    onOpen,
    onClose,
  } = props;

  const { map } = useMap(MINI_MAP_ID);

  const handleOpen = () => {
    if (!map) {
      return;
    }

    map.resize();
    onOpen();
  };

  const locationsByLayer = useMemo(() => {
    const map = new Map<string, Location[]>();

    for (const loc of locations) {
      if (!map.has(loc.layerId)) {
        map.set(loc.layerId, []);
      }
      map.get(loc.layerId)!.push(loc);
    }

    return map;
  }, [locations]);

  return (
    <Collapsible
      width="25rem"
      collapseProps={{ h: '100%' }}
      groupProps={{ h: '100%' }}
      onOpen={handleOpen}
      onClose={onClose}
    >
      <Box className={styles.panelWrapper}>
        <Box className={styles.accordionBody}>
          {layers.length > 0 ? (
            [...layers]
              .sort((a, b) => a.position - b.position)
              .map((layer) => (
                <Accordion
                  key={`layers-accordion-${layer.id}`}
                  sticky="top"
                  items={[
                    {
                      id: `layers-accordion-${layer.id}`,
                      title: <Header layer={layer} includeDates={false} />,
                      content: (
                        <Layer
                          layer={layer}
                          locations={locationsByLayer.get(layer.id) ?? []}
                          onLocationAdd={onLocationAdd}
                          onLocationRemove={onLocationRemove}
                        />
                      ),
                    },
                  ]}
                  variant={Variant.Secondary}
                />
              ))
          ) : (
            <Fallback />
          )}
        </Box>
        <Box className={styles.miniMapWrapper}>
          <MiniMap
            layers={layers}
            layerEntries={layerEntries}
            locations={locations}
            layerLocationGroups={layerLocationGroups}
          />
        </Box>
      </Box>
    </Collapsible>
  );
};

export default Panel;
