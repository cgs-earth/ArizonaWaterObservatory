/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flex, Text } from '@mantine/core';
import Square from '@/assets/Square';
import styles from '@/features/Tools/Tools.module.css';
import { Layer } from '@/stores/main/types';
import { LegendEntry } from '@/stores/session/types';

type Props = {
  layerId: Layer['id'];
  color: LegendEntry['color'];
  direction?: 'row' | 'column';
};

export const Grid: React.FC<Props> = (props) => {
  const { layerId, color, direction = 'row' } = props;
  const isRow = direction === 'row';

  const containerClass = isRow ? styles.row : styles.column;
  const contrastClass = `${styles.legendContrast} ${isRow ? styles.column : styles.row}`;
  const labelClass = `${styles.labelColumn} ${isRow ? styles.column : styles.row}`;

  const labelWidth = !isRow ? 70 : undefined;
  const labelGap = isRow ? 'calc(var(--default-spacing) * 2)' : 'calc(var(--default-spacing) * 1)';
  const textAlign = isRow ? undefined : 'center';

  const iconGap = isRow ? 'var(--default-spacing)' : 'calc(var(--default-spacing) * 6.75)';
  // const labelGap = isRow ? 'var(--default-spacing)' : 'calc(var(--default-spacing) * 6)';

  const labels = ['Grid Spaces', 'Selected Grid Spaces'];

  const iconRowMargin = isRow ? undefined : 16;

  return (
    <Flex
      className={containerClass}
      justify="flex-start"
      align="flex-start"
      gap="var(--default-spacing)"
    >
      <Flex className={contrastClass} gap={iconGap} ml={iconRowMargin}>
        <Square fill={color} />
        <Square fill={color} stroke="#fff" />
      </Flex>

      <Flex className={labelClass} gap={labelGap} align="flex-start" mt={isRow ? 8 : undefined}>
        {labels.map((label) => (
          <Text key={`${layerId}-${label}`} size="xs" w={labelWidth} ta={textAlign}>
            {label}
          </Text>
        ))}
      </Flex>
    </Flex>
  );
};
