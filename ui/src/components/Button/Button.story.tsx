/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Button from '@/components/Button';
import { Variant } from '@/components/types';

export default {
  title: 'Button',
};

export const Usage = () => <Button>Button Text</Button>;
export const Primary = () => <Button variant={Variant.Primary}>Button Text</Button>;
export const Secondary = () => <Button variant={Variant.Secondary}>Button Text</Button>;
export const Tertiary = () => <Button variant={Variant.Tertiary}>Button Text</Button>;
