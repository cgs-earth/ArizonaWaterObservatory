/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Plus from '@/assets/Plus';
import IconButton from '@/components/IconButton';
import { ExtendedVariant } from '@/components/IconButton/IconButton.types';
import { Variant } from '@/components/types';

export default {
  title: 'IconButton',
};

export const Usage = () => (
  <IconButton>
    <Plus />
  </IconButton>
);
export const Primary = () => (
  <IconButton variant={Variant.Primary}>
    <Plus />
  </IconButton>
);
export const Secondary = () => (
  <IconButton variant={Variant.Secondary}>
    <Plus />
  </IconButton>
);
export const Tertiary = () => (
  <IconButton variant={Variant.Tertiary}>
    <Plus />
  </IconButton>
);
export const Unstyled = () => (
  <IconButton variant={ExtendedVariant.Unstyled}>
    <Plus />
  </IconButton>
);
