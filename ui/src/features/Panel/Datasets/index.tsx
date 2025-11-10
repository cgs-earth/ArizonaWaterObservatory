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
import { Box, Text, Title, Tooltip, VisuallyHidden } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Dataset from '@/features/Panel/Datasets/Dataset';
import { Control } from '@/features/Panel/Datasets/Dataset/Control';
import { Header } from '@/features/Panel/Datasets/Dataset/Header';
import Filter from '@/features/Panel/Datasets/Filter';
import { FilterTitle } from '@/features/Panel/Datasets/Filter/Header';
import styles from '@/features/Panel/Panel.module.css';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { filterCollections } from '@/utils/filterCollections';

type Props = {
  layersRef: RefObject<HTMLDivElement | null>;
  setDatasetsOpen: Dispatch<SetStateAction<boolean>>;
};

const Datasets: React.FC<Props> = (props) => {
  const { layersRef, setDatasetsOpen } = props;

  const provider = useMainStore((state) => state.provider);
  const category = useMainStore((state) => state.category);
  const parameterGroupMembers = useMainStore((state) => state.parameterGroupMembers);
  const datasets = useMainStore((state) => state.collections);
  const loadingInstances = useSessionStore((state) => state.loadingInstances);

  const [maxHeight, setMaxHeight] = useState(555);

  const [value, setValue] = useState<string | null>();
  const [filteredDatasets, setFilteredDatasets] = useState<ICollection[]>(datasets);

  const accordions = useMemo(() => {
    const accordions: ReactElement[] = [
      <Accordion
        key="datasets-filter-parent-accordion"
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

    filteredDatasets.forEach((dataset) => {
      accordions.push(
        <Accordion
          key={`datasets-accordion-parent-${dataset.id}`}
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
  }, [filteredDatasets]);

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

  useEffect(() => {
    if (datasets.length === 0) {
      return;
    }

    const filteredDatasets = filterCollections(datasets, provider, category, parameterGroupMembers);
    setFilteredDatasets(filteredDatasets);
  }, [datasets, provider, category, parameterGroupMembers]);

  const handleChange = (value: string | null) => {
    setDatasetsOpen(Boolean(value) && value === 'datasets-accordion');
    setValue(value);
  };

  const datasetHelpText = (
    <>
      <Text size="sm">Datasets are collections of scientific measurements.</Text>
      <br />
      <Text size="sm">
        Click the "+" button to create a layer from a dataset and start interacting <br /> with the
        data on the map or in application tools.
      </Text>
    </>
  );

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
            <>
              <Tooltip label={datasetHelpText} openDelay={500}>
                <Title order={2} size="h3">
                  Datasets
                </Title>
              </Tooltip>
              <VisuallyHidden>{datasetHelpText}</VisuallyHidden>
            </>
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
