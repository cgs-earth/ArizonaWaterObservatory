/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';

type ItemBase = {
  label: string;
  left?: ReactNode;
  right?: ReactNode;
};

export type ActionItem = ItemBase & {
  onClick: () => void;
};

export type MenuItem = ItemBase & {
  subItems: Item[];
};

export type Item = ActionItem | MenuItem;

export type Section = {
  title?: string;
  items: Item[];
};
