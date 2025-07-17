/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { NumberInput as _NumberInput, NumberInputProps } from '@mantine/core';
import styles from '@/components/NumberInput/NumberInput.module.css';

const NumberInput: React.FC<NumberInputProps> = (props) => {
  return <_NumberInput classNames={{ input: styles.input }} size="md" radius={0} {...props} />;
};

export default NumberInput;
