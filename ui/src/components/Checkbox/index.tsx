/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent } from 'react';
import { Checkbox, CheckboxProps, useMantineColorScheme, useMantineTheme } from '@mantine/core';
import styles from '@/components/Checkbox/Checkbox.module.css';

const CustomCheckbox: React.FC<CheckboxProps> = (props) => {
  const { onClick = () => null, ...checkboxProps } = props;

  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const color = colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.dark[9];

  const handleClick = (event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
    onClick(event);
  };

  return (
    <Checkbox
      classNames={{
        input: styles.input,
        icon: colorScheme === 'dark' ? styles.iconDark : styles.iconLight,
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

export default CustomCheckbox;
