/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Text, Tooltip } from '@mantine/core';
import { ICollection } from '@/services/edr.service';
import { getParameterList } from '@/utils/parameters';
import { getProvider } from '@/utils/provider';

type Props = {
  dataset: ICollection;
};

export const Header: React.FC<Props> = (props) => {
  const { dataset } = props;

  const provider = getProvider(dataset.id);

  return (
    <Tooltip label="Click to show dataset details" openDelay={500}>
      <Stack justify="center" gap={1}>
        <Text component="h3" size="lg" lineClamp={2} title={dataset.title} fw={500}>
          <strong>{provider}</strong> {dataset.title}
        </Text>
        <Text size="xs" lineClamp={2}>
          <strong>Parameters:</strong> {getParameterList(dataset).join(', ')}
        </Text>
      </Stack>
    </Tooltip>
  );
};
