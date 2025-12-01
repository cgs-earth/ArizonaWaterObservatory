/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactElement, ReactNode } from 'react';
import { Menu as MenuComponent, MenuProps } from '@mantine/core';
import styles from '@/components/Menu/Menu.module.css';
import { Section } from './Section';
import { Section as SectionType } from './types';

type Props = MenuProps & {
  target: ReactElement;
  sections?: SectionType[];
  children?: ReactNode;
};

const Menu: React.FC<Props> = (props) => {
  const { target, sections, children } = props;

  return (
    <MenuComponent classNames={{ dropdown: styles.dropdown, item: styles.item }}>
      <MenuComponent.Target>{target}</MenuComponent.Target>
      <MenuComponent.Dropdown>
        {children
          ? children
          : sections?.map((section, index) => (
              <Section key={`section-${section?.title}-${index}`} section={section} />
            ))}
      </MenuComponent.Dropdown>
    </MenuComponent>
  );
};

export default Menu;
