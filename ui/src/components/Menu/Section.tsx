/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Menu } from '@mantine/core';
import { Item } from './Item';
import { Section as SectionType } from './types';

type Props = {
  section: SectionType;
};
export const Section: React.FC<Props> = (props) => {
  const { section } = props;

  return (
    <>
      {(section.title ?? '').length > 0 && (
        <>
          <Menu.Label>{section.title}</Menu.Label>
          {section.items.map((item) => (
            <Item item={item} />
          ))}
        </>
      )}
    </>
  );
};
