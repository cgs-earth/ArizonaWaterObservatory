/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Accordion from '@/components/Accordion';
import { Item } from '@/components/Accordion/Accordion.types';
import { Variant } from '@/components/types';

const items: Item[] = [
  { id: 'item-1', title: 'Item 1', content: 'Content 1' },
  { id: 'item-2', title: 'Item 2', content: 'Content 2' },
];

describe('Accordion', () => {
  it('renders all accordion items', () => {
    render(<Accordion items={items} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Accordion items={items} variant={Variant.Secondary} />);
    const item = container.querySelector('.mantine-Accordion-item');
    expect(item?.className).toMatch(/secondary/);
  });

  it('expands and collapses content on click', () => {
    render(<Accordion items={items} />);
    const control = screen.getByText('Item 1');
    fireEvent.click(control);
    expect(screen.getByText('Content 1')).toBeVisible();

    fireEvent.click(control);
    expect(screen.queryByText('Content 1')).toBeVisible();
  });
});
