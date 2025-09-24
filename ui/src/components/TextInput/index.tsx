/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { TextInput as _TextInput, TextInputProps } from '@mantine/core';
import styles from '@/components/TextInput/TextInput.module.css';

const TextInput: React.FC<TextInputProps> = (props) => {
  return <_TextInput classNames={{ input: styles.input }} size="md" radius={0} {...props} />;
};

export default TextInput;
