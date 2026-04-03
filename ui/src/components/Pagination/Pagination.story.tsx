/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Pagination from '@/components/Pagination';
import { Variant } from '@/components/types';

export default {
  title: 'Pagination',
};

export const Usage = () => <Pagination total={10} />;
export const Primary = () => <Pagination variant={Variant.Primary} total={10} />;
export const Secondary = () => <Pagination variant={Variant.Secondary} total={10} />;
export const Tertiary = () => <Pagination variant={Variant.Tertiary} total={10} />;
