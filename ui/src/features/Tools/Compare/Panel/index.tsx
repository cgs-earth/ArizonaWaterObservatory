/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '@mantine/core';
import Accordion from '@/components/Accordion';
import Collapsible from '@/components/Collapsible';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { Layer as LayerType, Location } from '@/stores/main/types';
import MiniMap from '../MiniMap';
import { MINI_MAP_ID } from '../MiniMap/consts';
import { Layer } from './Layer';

type Props = {
  layers: LayerType[];
  locations: Location[];
  onLocationAdd: (location: Location) => void;
  onLocationRemove: (location: Location) => void;
  onOpen: () => void;
  onClose: () => void;
};

const Panel: React.FC<Props> = (props) => {
  const { layers, locations, onLocationAdd, onLocationRemove, onOpen, onClose } = props;

  const { map } = useMap(MINI_MAP_ID);

  const handleOpen = () => {
    if (!map) {
      return;
    }

    map.resize();
    onOpen();
  };

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
                      title: <Header layer={layer} />,
                      content: (
                        <Layer
                          layer={layer}
                          locations={locations}
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
          <MiniMap locations={locations} />
        </Box>
      </Box>
    </Collapsible>
  );
};

export default Panel;
