/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import {
  Accordion as _Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  AccordionProps,
  Center,
} from '@mantine/core';
import Plus from '@/assets/Plus';
import styles from '@/components/Accordion/Accordion.module.css';
import { Item } from '@/components/Accordion/Accordion.types';
import { Variant } from '@/components/types';

type Props = AccordionProps & {
  items: Item[];
  sticky?: 'top' | 'bottom';
  variant?: Variant;
};

type ExtendedAccordionProps = {
  content: ReactNode;
  control: ReactNode;
};

const ExtendedAccordionControl: React.FC<ExtendedAccordionProps> = (props) => {
  const { content, control } = props;
  return (
    <Center>
      <AccordionControl>{content}</AccordionControl>
      {control}
    </Center>
  );
};

const Accordion: React.FC<Props> = (props) => {
  const { items, sticky = '', variant = Variant.Primary, ...accordionProps } = props;

  const variantClass = styles[variant];

  return (
    <_Accordion
      {...accordionProps}
      className={
        sticky.length > 0 ? `${styles.sticky} ${sticky === 'top' ? styles.top : styles.bottom}` : ''
      }
      classNames={{
        item: `${styles.item} ${variantClass}`,
        control: styles.control,
        label: styles.label,
        panel: styles.panel,
        content: styles.content,
        chevron: styles.chevron,
      }}
      chevron={<Plus />}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} ref={item.ref}>
          {item?.control ? (
            <ExtendedAccordionControl content={item.title} control={item.control} />
          ) : (
            <AccordionControl>{item.title}</AccordionControl>
          )}

          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </_Accordion>
  );
};

export default Accordion;
