/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu } from '@mantine/core';
import { ActionItem as ActionItemType } from './types';

type Props = {
  item: ActionItemType;
};

export const ActionItem: React.FC<Props> = (props) => {
  const { item } = props;

  return (
    <Menu.Item leftSection={item.left} rightSection={item.right} onClick={item.onClick}>
      {item.label}
    </Menu.Item>
  );
};
