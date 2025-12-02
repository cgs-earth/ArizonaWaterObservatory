/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Accordion from '@/components/Accordion';
import { Variant } from '@/components/types';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import { Control } from '@/features/Panel/Datasets/Dataset/Control';
import { Header } from '@/features/Panel/Datasets/Dataset/Header';
import { useLoading } from '@/hooks/useLoading';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';
import { Content } from './Content';

type Props = {
  dataset: ICollection;
};

const Dataset: React.FC<Props> = (props) => {
  const { dataset } = props;

  const [parameterLimit, setParameterLimit] = useState<number | null>(null);
  const [parameters, setParameters] = useState<Layer['parameters']>([]);
  const { isFetchingCollections } = useLoading();

  useEffect(() => {
    if (isFetchingCollections) {
      return;
    }

    if (dataset) {
      const restrictions = CollectionRestrictions[dataset.id];

      if (restrictions && restrictions.length > 0) {
        const parameterLimitRestriction = restrictions.find(
          (restriction) => restriction.type === RestrictionType.Parameter
        );

        if (parameterLimitRestriction && parameterLimitRestriction.count > 0) {
          setParameterLimit(parameterLimitRestriction.count);
        }
      }
    }
  }, [isFetchingCollections, dataset]);

  const isParameterSelectionOverLimit = parameterLimit ? parameters.length > parameterLimit : false;

  const handleParametersChange = (parameters: Layer['parameters']) => {
    setParameters(parameters);
  };

  return (
    <Accordion
      key={`datasets-accordion-parent-${dataset.id}`}
      items={[
        {
          id: `datasets-accordion-${dataset.id}`,
          title: <Header dataset={dataset} />,
          content: (
            <Content
              dataset={dataset}
              parameters={parameters}
              handleParametersChange={handleParametersChange}
              parameterLimit={parameterLimit}
              isParameterSelectionOverLimit={isParameterSelectionOverLimit}
            />
          ),
          control: (
            <Control
              dataset={dataset}
              parameters={parameters}
              isParameterSelectionOverLimit={isParameterSelectionOverLimit}
            />
          ),
        },
      ]}
      variant={Variant.Secondary}
    />
  );
};

export default Dataset;
