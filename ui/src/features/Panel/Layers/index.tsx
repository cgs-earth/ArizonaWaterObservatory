/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Layer from '@/features/Panel/Layers/Layer';
import { Control } from '@/features/Panel/Layers/Layer/Control';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import styles from '@/features/Panel/Panel.module.css';
import useMainStore from '@/stores/main';

const Layers: React.FC = () => {
  const layers = useMainStore((state) => state.layers);

  return (
    <Box className={styles.accordionBody}>
      {layers.length > 0 ? (
        [...layers]
          .sort((a, b) => a.position - b.position)
          .map((layer) => (
            <Accordion
              key={`layers-accordion-${layer.id}`}
              items={[
                {
                  id: `layers-accordion-${layer.id}`,
                  title: <Header layer={layer} />,
                  content: <Layer layer={layer} />,
                  control: <Control layer={layer} />,
                },
              ]}
              variant={Variant.Secondary}
            />
          ))
      ) : (
        <Fallback />
      )}
    </Box>
  );
};

export default Layers;
