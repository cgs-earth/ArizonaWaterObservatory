/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Dispatch,
  ReactElement,
  // Ref,
  RefObject,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Box, Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Dataset from '@/features/Panel/Datasets/Dataset';
import { Control } from '@/features/Panel/Datasets/Dataset/Control';
import { Header } from '@/features/Panel/Datasets/Dataset/Header';
import Filter from '@/features/Panel/Datasets/Filter';
import { FilterTitle } from '@/features/Panel/Datasets/Filter/Header';
import styles from '@/features/Panel/Panel.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';

type Props = {
  layersRef: RefObject<HTMLDivElement | null>;
  setDatasetsOpen: Dispatch<SetStateAction<boolean>>;
};

const Datasets: React.FC<Props> = (props) => {
  const { layersRef, setDatasetsOpen } = props;

  const datasets = useMainStore((state) => state.collections);
  const loadingInstances = useSessionStore((state) => state.loadingInstances);

  const [maxHeight, setMaxHeight] = useState(555);

  const [value, setValue] = useState<string | null>();

  const accordions = useMemo(() => {
    const accordions: ReactElement[] = [
      <Accordion
        items={[
          {
            id: 'datasets-filter-accordion',
            title: <FilterTitle />,
            content: <Filter />,
          },
        ]}
        variant={Variant.Tertiary}
      />,
    ];

    datasets.forEach((dataset) => {
      accordions.push(
        <Accordion
          items={[
            {
              id: `datasets-accordion-${dataset.id}`,
              title: <Header dataset={dataset} />,
              content: <Dataset dataset={dataset} />,
              control: <Control dataset={dataset} />,
            },
          ]}
          variant={Variant.Secondary}
        />
      );
    });
    return accordions;
  }, [datasets]);

  useEffect(() => {
    if (!layersRef.current) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const header = document.getElementById('header-wrapper');
      const layers = document.getElementById('layers-wrapper');
      const datasets = document.getElementById('datasets-wrapper-control-datasets-accordion');

      if (header && layers && datasets) {
        const total =
          header.getBoundingClientRect().height +
          layers.getBoundingClientRect().height +
          datasets.getBoundingClientRect().height;

        setMaxHeight(Math.min(total, 555));
      }
    });

    observer.observe(layersRef.current);
    return () => observer.disconnect();
  }, [layersRef.current]);

  const handleChange = (value: string | null) => {
    setDatasetsOpen(Boolean(value) && value === 'datasets-accordion');
    setValue(value);
  };

  return (
    <Accordion
      id="datasets-wrapper"
      value={value}
      onChange={handleChange}
      sticky="top"
      items={[
        {
          id: 'datasets-accordion',

          title: (
            <Title order={2} size="h3">
              Datasets
            </Title>
          ),
          content: (
            <Box
              className={styles.accordionBody}
              mah={`calc(100vh - ${maxHeight + (loadingInstances.length > 0 ? 12 : 0)}px)`}
            >
              {accordions}
            </Box>
          ),
        },
      ]}
      variant={Variant.Primary}
    />
  );
};

export default Datasets;
