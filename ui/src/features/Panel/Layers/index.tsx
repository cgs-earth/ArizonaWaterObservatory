/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Box, Text, Title, Tooltip } from '@mantine/core';
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

  const [value, setValue] = useState<string | null>();

  const helpText = (
    <>
      <Text size="sm">Layers are customizable instances of a dataset.</Text>
      <br />
      <Text size="sm">
        Add one or more instances of a dataset using the controls above, then <br />
        customize it here. Filter locations by parameter, relabel/recolor the layer,
        <br /> and set a default date range for data exports.
      </Text>
    </>
  );

  return (
    <Accordion
      id="layers-wrapper"
      value={value}
      onChange={setValue}
      sticky="top"
      items={[
        {
          id: 'layers-accordion',
          title: (
            <Tooltip label={helpText} openDelay={500}>
              <Title order={2} size="h3">
                Layers
              </Title>
            </Tooltip>
          ),
          content: (
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
          ),
        },
      ]}
      variant={Variant.Primary}
    />
  );
};

export default Layers;
