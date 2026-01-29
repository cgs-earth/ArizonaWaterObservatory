/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement, useEffect, useMemo, useState } from 'react';
import { Box } from '@mantine/core';
import Dataset from '@/features/Panel/Datasets/Dataset';
import Filter from '@/features/Panel/Datasets/Filter';
import styles from '@/features/Panel/Panel.module.css';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { filterCollections } from '@/utils/filterCollections';

const Datasets: React.FC = () => {
  const search = useMainStore((state) => state.search);
  const provider = useMainStore((state) => state.provider);
  const category = useMainStore((state) => state.category);
  const parameterGroupMembers = useMainStore((state) => state.parameterGroupMembers);
  const datasets = useMainStore((state) => state.collections);

  const [filteredDatasets, setFilteredDatasets] = useState<ICollection[]>(datasets);

  const accordions = useMemo(() => {
    const accordions: ReactElement[] = [<Filter key="datasets-accordion-filter" />];

    filteredDatasets.forEach((dataset) => {
      accordions.push(
        <Dataset key={`datasets-accordion-parent-${dataset.id}`} dataset={dataset} />
      );
    });
    return accordions;
  }, [filteredDatasets]);

  useEffect(() => {
    if (datasets.length === 0) {
      return;
    }

    const filteredDatasets = filterCollections(
      datasets,
      search,
      provider,
      category,
      parameterGroupMembers
    );

    setFilteredDatasets(filteredDatasets);
  }, [datasets, search, provider, category, parameterGroupMembers]);

  return <Box className={styles.accordionBody}>{accordions}</Box>;
};

export default Datasets;
