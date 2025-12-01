/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionItem } from './ActionItem';
import { MenuItem } from './MenuItem';
import { Item as ItemType } from './types';
import { isMenuItem } from './utils';

type Props = {
  item: ItemType;
};

export const Item: React.FC<Props> = (props) => {
  const { item } = props;

  return <>{isMenuItem(item) ? <MenuItem item={item} /> : <ActionItem item={item} />}</>;
};
