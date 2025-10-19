/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { RefObject, useEffect, useMemo, useState } from 'react';
import { Box, Text, Title, Tooltip } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Layer from '@/features/Panel/Layers/Layer';
import { Control } from '@/features/Panel/Layers/Layer/Control';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import styles from '@/features/Panel/Panel.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';

type Props = {
  datasetsOpen: boolean;
  layersRef: RefObject<HTMLDivElement | null>;
};

const Layers: React.FC<Props> = (props) => {
  const { datasetsOpen, layersRef } = props;

  const layers = useMainStore((state) => state.layers);
  const loadingInstances = useSessionStore((state) => state.loadingInstances);

  const [maxHeight, setMaxHeight] = useState(datasetsOpen ? 605 : 215);
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
              control: <Control layer={layer} />,
            },
          ]}
          variant={Variant.Secondary}
        />
      )),
    [layers]
  );

  useEffect(() => {
    const datasetOffset = datasetsOpen ? 605 : 215;
    const loadingBarOffset = loadingInstances.length > 0 ? 12 : 0;

    setMaxHeight(datasetOffset + loadingBarOffset);
  }, [datasetsOpen, loadingInstances]);

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
      sticky="bottom"
      items={[
        {
          id: 'layers-accordion',
          ref: layersRef,
          title: (
            <Tooltip label={helpText} openDelay={500}>
              <Title order={2} size="h3">
                Layers
              </Title>
            </Tooltip>
          ),
          content: (
            <Box mah={`calc(100vh - ${maxHeight}px)`} className={styles.accordionBody}>
              {accordions.length > 0 ? accordions : <Fallback />}
            </Box>
          ),
        },
      ]}
      variant={Variant.Primary}
    />
  );
};

export default Layers;
