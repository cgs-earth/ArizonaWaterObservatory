/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Accordion as _Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  AccordionProps,
} from '@mantine/core';
import styles from '@/components/Accordion/Accordion.module.css';
import { Item } from '@/components/Accordion/Accordion.types';
import { Variant } from '../types';

type Props = AccordionProps & {
  items: Item[];
  variant?: Variant;
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
      }}
    >
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id}>
          <AccordionControl>{item.title}</AccordionControl>
          <AccordionPanel>{item.content}</AccordionPanel>
        </AccordionItem>
      ))}
    </_Accordion>
  );
};

export default Accordion;
