/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent } from 'react';
import {
  Checkbox as _Checkbox,
  CheckboxProps,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import styles from '@/components/Checkbox/Checkbox.module.css';

const Checkbox: React.FC<CheckboxProps> = (props) => {
  const { onClick, ...checkboxProps } = props;

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const color = colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.dark[9];

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <_Checkbox
      classNames={{
        input: styles.input,
        icon: styles.icon,
      }}
      color={color}
      radius="xs"
      size="md"
      variant="outline"
      onClick={handleClick}
      {...checkboxProps}
    />
  );
};

export default Checkbox;
