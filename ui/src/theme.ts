/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Checkbox, createTheme, Radio } from '@mantine/core';

export const theme = createTheme({
  cursorType: 'pointer',
  fontFamily: 'Arial, Helvetica, sans-serif',
  headings: {
    fontFamily: 'Arial, Helvetica, sans-serif',
  },
  components: {
    Radio: Radio.extend({
      styles: {
        label: {
          paddingInlineStart: 'var(--default-spacing)',
        },
      },
    }),
    Checkbox: Checkbox.extend({
      styles: {
        label: {
          paddingInlineStart: 'var(--default-spacing)',
        },
      },
    }),
  },
});
