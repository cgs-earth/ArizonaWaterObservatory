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
import Chevron from '@/assets/Chevron';
import styles from '@/components/Accordion/Accordion.module.css';
import { Item } from '@/components/Accordion/Accordion.types';
import { Variant } from '@/components/types';

type Props = AccordionProps & {
  items: Item[];
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
  const { items, variant = Variant.Primary, ...accordionProps } = props;

  const variantClass = styles[variant];

  return (
    <_Accordion
      {...accordionProps}
      classNames={{
        item: `${styles.item} ${variantClass}`,
        control: styles.control,
        label: styles.label,
        panel: styles.panel,
        content: styles.content,
        chevron: styles.chevron,
      }}
      chevron={<Chevron />}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
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
