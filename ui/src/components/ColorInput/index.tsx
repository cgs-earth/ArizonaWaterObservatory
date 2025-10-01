/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ColorInput as _ColorInput, ColorInputProps } from '@mantine/core';
import styles from '@/components/ColorInput/ColorInput.module.css';

const ColorInput: React.FC<ColorInputProps> = (props) => {
  return <_ColorInput classNames={{ input: styles.input }} size="md" radius={0} {...props} />;
};

export default ColorInput;
