/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Accordion,
  AccordionControl,
  AccordionItem,
  AccordionPanel,
  AccordionProps,
} from '@mantine/core';
import styles from '@/components/Accordion/Accordion.module.css';
import { Item } from '@/components/Accordion/Accordion.types';

type Props = AccordionProps & {
  items: Item[];
  variant?: 'primary' | 'secondary' | 'tertiary';
};

const CustomAccordion: React.FC<Props> = (props) => {
  const { items, variant = 'primary', ...accordionProps } = props;

  const getVariantClass = (variant: 'primary' | 'secondary' | 'tertiary'): string => {
    if (variant === 'secondary') {
      return styles.secondary;
    }

    if (variant === 'tertiary') {
      return styles.tertiary;
    }

    return styles.primary;
  };

  const variantClass = getVariantClass(variant);

  return (
    <Accordion
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
    </Accordion>
  );
};

export default CustomAccordion;
