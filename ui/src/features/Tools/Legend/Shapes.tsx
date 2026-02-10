/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Flex, Text } from '@mantine/core';
import Circle from '@/assets/Circle';
import Line from '@/assets/Line';
import Square from '@/assets/Square';
import styles from '@/features/Tools/Tools.module.css';
import { Layer } from '@/stores/main/types';
import { LegendEntry } from '@/stores/session/types';

type Props = {
  layerId: Layer['id'];
  color: LegendEntry['color'];
  direction?: 'row' | 'column';
};

export const Shapes: React.FC<Props> = (props) => {
  const { layerId, color, direction = 'row' } = props;

  const isRow = direction === 'row';

  const containerClass = isRow ? styles.row : styles.column;
  const contrastClass = `${styles.legendContrast} ${isRow ? styles.column : styles.row}`;
  const labelClass = `${styles.labelColumn} ${isRow ? styles.column : styles.row}`;

  const iconGap = isRow ? 'var(--default-spacing)' : 'calc(var(--default-spacing) * 6)';

  const labelWidth = !isRow ? 65 : undefined;

  const icons = [
    <Circle key="circle" fill={color} />,
    <Line key="line" color={color} />,
    <Square key="square" fill={color} />,
    <Circle key="circle-selected" fill={color} stroke="#fff" />,
  ];

  const labels = ['Point Locations', 'Line Locations', 'Polygon Locations'];
  const textAlign = isRow ? undefined : 'center';
  const iconAlign = isRow ? undefined : 'center';
  const iconRowMargin = isRow ? undefined : 16;

  return (
    <Flex
      className={containerClass}
      justify="flex-start"
      align="flex-start"
      gap="var(--default-spacing)"
    >
      <Flex className={contrastClass} gap={iconGap} align={iconAlign} ml={iconRowMargin}>
        {icons}
      </Flex>

      <Flex
        className={labelClass}
        gap="var(--default-spacing)"
        align="flex-start"
        mt={isRow ? 8 : undefined}
      >
        {labels.map((label) => (
          <Text key={`${layerId}-${label}`} size="xs" w={labelWidth} ta={textAlign}>
            {label}
          </Text>
        ))}

        <Flex direction="column" gap={0}>
          <Text size="xs" w={labelWidth} ta={textAlign}>
            Selected Locations
          </Text>
          <Text size="xs" w={labelWidth} ta={textAlign}>
            (all shapes)
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};
