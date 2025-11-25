/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useState } from 'react';
import { Anchor, Divider, Group, List, ListItem, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Panel.module.css';
import { ICollection } from '@/services/edr.service';
import { getParameterList } from '@/utils/parameters';

type Props = {
  dataset: ICollection;
};

const Dataset: React.FC<Props> = (props) => {
  const { dataset } = props;

  const [parameters, setParameters] = useState<string[]>([]);
  const [filteredParameters, setFilteredParameters] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(5);

  const [datasetLink, setDatasetLink] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [documentationLink, setDocumentationLink] = useState('');

  useEffect(() => {
    const parameters = getParameterList(dataset, -1).sort();
    setParameters(parameters);
    setFilteredParameters(parameters);

    const datasetLink =
      dataset.links.find((link) => link.rel === 'alternate' && link.type === 'text/html')?.href ??
      '';
    const sourceLink = dataset.links.find((link) => link.rel === 'canonical')?.href ?? '';
    const documentationLink =
      dataset.links.find((link) => link.rel === 'documentation')?.href ?? '';

    setDatasetLink(datasetLink);
    setSourceLink(sourceLink);
    setDocumentationLink(documentationLink);
  }, [dataset]);

  useEffect(() => {
    if (search.length === 0) {
      setFilteredParameters(parameters);
    } else {
      const lowercaseSearch = search.toLowerCase();
      const filteredParameters = parameters.filter((parameter) =>
        parameter.toLowerCase().includes(lowercaseSearch)
      );

      setFilteredParameters(filteredParameters);
    }
  }, [search, parameters]);

  const showMore = filteredParameters.length > show;
  const showLess = show > 5;

  const description = (
    <>
      <Text size="xs">
        Browse parameters contained within this dataset. These are scientific measurements that can
        be queried for after creating an instance of this dataset.
      </Text>
    </>
  );

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
    <Stack gap="xs" className={styles.accordionContent}>
      <Text size="sm">This dataset {dataset.description}</Text>
      {parameters.length > 0 && (
        <>
          <TextInput
            size="sm"
            label="Explore"
            description={description}
            // description=""
            placeholder="Parameters"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            __clearable
            error={
              search.length > 0 && filteredParameters.length === 0
                ? 'No parameters matching search term'
                : null
            }
          />
          <Divider />
          <Stack gap={0}>
            <Text size="md" fw={500}>
              Available Parameters:
            </Text>
            {filteredParameters.length === 0 ? (
              <Text size="xs">No Parameters</Text>
            ) : (
              <List size="xs">
                {filteredParameters.slice(0, show).map((parameter) => (
                  <ListItem key={`${dataset.id}-${parameter}`}>{parameter}</ListItem>
                ))}
              </List>
            )}
          </Stack>
          {filteredParameters.length > show && (
            <Group justify="center">
              {showMore && (
                <Button size="xs" variant={Variant.Primary} onClick={() => setShow(show + 5)}>
                  Show more
                </Button>
              )}
              {showMore && showLess && <Divider orientation="vertical" />}
              {showLess && (
                <Button
                  size="xs"
                  variant={Variant.Primary}
                  onClick={() => setShow(Math.max(show - 5, 5))}
                >
                  Show less
                </Button>
              )}
            </Group>
          )}
        </>
      )}

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

export default Dataset;
