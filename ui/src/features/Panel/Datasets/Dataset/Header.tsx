/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stack, Text, Tooltip } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';
import { ICollection } from '@/services/edr.service';
import { getParameterList } from '@/utils/parameters';

type Props = {
  dataset: ICollection;
};

export const Header: React.FC<Props> = (props) => {
  const { dataset } = props;

  const parameters = getParameterList(dataset);

  return (
    <Tooltip label="Click to show dataset details" openDelay={500}>
      <Stack justify="center" gap="calc(var(--default-spacing) / 4)">
        <Text component="h3" size="lg" lineClamp={2} title={dataset.title} fw={500}>
          {dataset.title}
        </Text>
        {parameters.length > 0 && (
          <Text size="xs" lineClamp={2} className={styles.datasetsParameterList}>
            <strong>Parameters:</strong> {getParameterList(dataset).join(', ')}
          </Text>
        )}
      </Stack>
    </Tooltip>
  );
};
