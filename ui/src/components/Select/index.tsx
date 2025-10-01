/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Select as _Select, SelectProps } from '@mantine/core';
import styles from '@/components/Select/Select.module.css';

const Select: React.FC<SelectProps> = (props) => {
  return (
    <_Select
      classNames={{ input: styles.input, dropdown: styles.dropdown }}
      size="md"
      radius={0}
      comboboxProps={{ offset: 0 }}
      {...props}
    />
  );
};

export default Select;
