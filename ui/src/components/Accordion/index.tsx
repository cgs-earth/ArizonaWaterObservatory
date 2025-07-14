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
import { Variant } from '../types';

type Props = AccordionProps & {
  items: Item[];
  variant?: Variant;
};

const CustomAccordion: React.FC<Props> = (props) => {
  const { items, variant = Variant.Primary, ...accordionProps } = props;

  const getVariantClass = (variant: Variant): string => {
    if (variant === Variant.Secondary) {
      return styles.secondary;
    }

    if (variant === Variant.Tertiary) {
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
