/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu } from '@mantine/core';
import { Item } from '@/components/Menu/Item';
import { MenuItem as MenuItemType } from '@/components/Menu/types';

type Props = {
  item: MenuItemType;
};

export const MenuItem: React.FC<Props> = (props) => {
  const { item } = props;

  return (
    <Menu.Sub>
      <Menu.Sub.Target>
        <Menu.Sub.Item leftSection={item.left} rightSection={item.right}>
          {item.label}
        </Menu.Sub.Item>
      </Menu.Sub.Target>
      <Menu.Sub.Dropdown>
        {item.subItems.map((subItem) => (
          <Item item={subItem} />
        ))}
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
