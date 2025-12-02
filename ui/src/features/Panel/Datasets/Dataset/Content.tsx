/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useState } from 'react';
import { Anchor, ComboboxData, Divider, Group, Stack, Text } from '@mantine/core';
import Select from '@/components/Select';
import styles from '@/features/Panel/Panel.module.css';
import { useLoading } from '@/hooks/useLoading';
import { ICollection } from '@/services/edr.service';
import { Layer } from '@/stores/main/types';

type Props = {
  dataset: ICollection;
  parameters: Layer['parameters'];
  handleParametersChange: (layer: Layer['parameters']) => void;
  parameterLimit: number | null;
  isParameterSelectionOverLimit: boolean;
};

export const Content: React.FC<Props> = (props) => {
  const {
    dataset,
    parameters,
    handleParametersChange,
    parameterLimit,
    isParameterSelectionOverLimit,
  } = props;

  const [data, setData] = useState<ComboboxData>();

  const [datasetLink, setDatasetLink] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [documentationLink, setDocumentationLink] = useState('');

  const { isFetchingCollections } = useLoading();

  useEffect(() => {
    if (isFetchingCollections || data) {
      return;
    }

    const datasetLink =
      dataset.links.find((link) => link.rel === 'alternate' && link.type === 'text/html')?.href ??
      '';
    const sourceLink = dataset.links.find((link) => link.rel === 'canonical')?.href ?? '';
    const documentationLink =
      dataset.links.find((link) => link.rel === 'documentation')?.href ?? '';

    setDatasetLink(datasetLink);
    setSourceLink(sourceLink);
    setDocumentationLink(documentationLink);

    const paramObjects = Object.values(dataset?.parameter_names ?? {});

    const newData = paramObjects
      .map((object) => ({
        label: object.name,
        value: object.id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
    setData(newData);
  }, [isFetchingCollections, dataset]);

  const getParameterError = () => {
    if (parameterLimit && isParameterSelectionOverLimit) {
      return `Please remove ${parameters.length - parameterLimit} parameter${parameters.length - parameterLimit > 1 ? 's' : ''}`;
    }

    return false;
  };

  const links = [
    { label: 'API', href: datasetLink, title: 'This dataset in the API' },
    { label: 'Source', href: sourceLink, title: 'Original source of pre-transformed data' },
    {
      label: 'Methodology',
      href: documentationLink,
      title: 'The methodology of the original source data',
    },
  ].filter((link) => link.href?.length > 0);

  return (
    <Stack gap="var(--default-spacing)" className={styles.accordionContent}>
      <Text size="sm">This dataset {dataset.description}</Text>
      <Select
        size="sm"
        label="Default Parameters"
        description="Show locations that contain data for selected parameter(s). Please note if more than one parameter is selected, shown locations may not contain data for all selected parameters."
        placeholder="Select a Parameter"
        multiple
        clearable
        searchable
        data={data}
        value={parameters}
        onChange={handleParametersChange}
        error={getParameterError()}
      />
      <Text size="xs" c="dimmed">
        These will be the default parameters for all layers created from this dataset. Parameters
        can be further customized for each layer instance within that layer's controls.
      </Text>

      <Group align="center" mt="var(--default-spacing)" gap="calc(var(--default-spacing) / 2)">
        {links.map(({ label, href, title }, index) => (
          <Fragment key={`${dataset.id}-link-${label}`}>
            {index > 0 && <Divider orientation="vertical" />}
            <Anchor target="_blank" href={href} title={title}>
              {label}
            </Anchor>
          </Fragment>
        ))}
      </Group>
    </Stack>
  );
};
