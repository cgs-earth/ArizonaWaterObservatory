/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement, useMemo } from 'react';
import { Title } from '@mantine/core';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import Dataset from '@/features/Panel/Datasets/Dataset';
import { Header } from '@/features/Panel/Datasets/Dataset/Header';
import Filter from '@/features/Panel/Datasets/Filter';
import { FilterTitle } from '@/features/Panel/Datasets/Filter/Header';
import useMainStore from '@/stores/main';

const Datasets: React.FC = () => {
  const datasets = useMainStore((state) => state.collections);

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
            },
          ]}
          variant={Variant.Secondary}
        />
      );
    });
    return accordions;
  }, [datasets]);

  return (
    <Accordion
      items={[
        {
          id: 'datasets-accordion',
          title: (
            <Title order={2} size="h3">
              Datasets
            </Title>
          ),
          content: accordions,
        },
      ]}
      variant={Variant.Primary}
    />
  );
};

export default Datasets;
