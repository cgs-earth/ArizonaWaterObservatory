/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Item, MenuItem } from './types';

export const isMenuItem = (item: Item): item is MenuItem => {
  return Array.isArray((item as MenuItem)?.subItems);
};
