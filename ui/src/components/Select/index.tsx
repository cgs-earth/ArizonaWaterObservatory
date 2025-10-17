/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Select as _Select, MultiSelect, MultiSelectProps, SelectProps } from '@mantine/core';
import styles from '@/components/Select/Select.module.css';

const Select: React.FC<SelectProps | MultiSelectProps> = (props) => {
  if (props.multiple) {
    return (
      <MultiSelect
        classNames={{ input: styles.input, dropdown: styles.dropdown }}
        size="md"
        radius={0}
        comboboxProps={{ offset: 0 }}
        {...(props as MultiSelectProps)}
      />
    );
  }

  return (
    <_Select
      classNames={{ input: styles.input, dropdown: styles.dropdown }}
      size="md"
      radius={0}
      comboboxProps={{ offset: 0 }}
      {...(props as SelectProps)}
    />
  );
};

export default Select;
