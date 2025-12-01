/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement } from 'react';
import { Menu as MenuComponent, MenuProps } from '@mantine/core';
import styles from '@/components/Menu/Menu.module.css';
import { Section } from './Section';
import { Section as SectionType } from './types';

type Props = MenuProps & {
  target: ReactElement;
  sections: SectionType[];
};

const Menu: React.FC<Props> = (props) => {
  const { target, sections } = props;

  return (
    <MenuComponent classNames={{ dropdown: styles.dropdown, item: styles.item }}>
      <MenuComponent.Target>{target}</MenuComponent.Target>
      <MenuComponent.Dropdown>
        {sections.map((section) => (
          <Section section={section} />
        ))}
      </MenuComponent.Dropdown>
    </MenuComponent>
  );
};

export default Menu;
