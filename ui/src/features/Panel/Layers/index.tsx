/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Layer from '@/features/Panel/Layers/Layer';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import useMainStore from '@/stores/main';

const Layers: React.FC = () => {
  const layers = useMainStore((state) => state.layers);

  const [value, setValue] = useState<string | null>();

  const accordions = useMemo(
    () =>
      layers.map((layer) => (
        <Accordion
          key={`layers-accordion-${layer.id}`}
          items={[
            {
              id: `layers-accordion-${layer.id}`,
              title: <Header layer={layer} />,
              content: <Layer layer={layer} />,
            },
          ]}
          variant={Variant.Secondary}
        />
      )),
    [layers]
  );

  return (
    <Accordion
      key={`layers-accordion${accordions.length === 0 ? '-no-layers' : ''}`}
      value={value}
      onChange={setValue}
      items={[
        {
          id: 'layers-accordion',
          title: (
            <Title order={2} size="h3">
              Layers
            </Title>
          ),
          content: accordions.length > 0 ? accordions : <Fallback />,
        },
      ]}
      variant={Variant.Primary}
    />
  );
};

export default Layers;
