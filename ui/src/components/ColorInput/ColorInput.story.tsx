/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import ColorInput from '@/components/ColorInput';

export default {
  title: 'ColorInput',
};

export const Usage = () => (
  <ColorInput
    label="Input label"
    description="Input description"
    placeholder="Input placeholder"
    defaultValue="#8C1D40"
  />
);
