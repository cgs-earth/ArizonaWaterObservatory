/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionItem } from '@/components/Menu/ActionItem';
import { MenuItem } from '@/components/Menu/MenuItem';
import { Item as ItemType } from '@/components/Menu/types';
import { isMenuItem } from '@/components/Menu/utils';

type Props = {
  item: ItemType;
};

export const Item: React.FC<Props> = (props) => {
  const { item } = props;

  return <>{isMenuItem(item) ? <MenuItem item={item} /> : <ActionItem item={item} />}</>;
};
