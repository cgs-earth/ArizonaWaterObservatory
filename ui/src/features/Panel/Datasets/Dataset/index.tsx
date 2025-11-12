/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
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

  const [link, setLink] = useState('');

  useEffect(() => {
    const parameters = getParameterList(dataset, -1).sort();
    setParameters(parameters);
    setFilteredParameters(parameters);

    const link =
      dataset.links.find((link) => link.rel === 'alternate' && link.type === 'text/html')?.href ??
      '';

    setLink(link);
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

      {link.length > 0 && (
        <Anchor target="_blank" href={link} mt="md">
          API
        </Anchor>
      )}
    </Stack>
  );
};

export default Dataset;
