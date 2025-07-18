/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import Button from '@/components/Button';
import { Variant } from '@/components/types';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button aria-label="icon-button" />);
    const button = screen.getByLabelText('icon-button');
    expect(button).toBeInTheDocument();
  });

  it('applies the correct variant class', () => {
    const { container } = render(<Button variant={Variant.Secondary} />);
    const item = container.querySelector('.mantine-Button-root');
    expect(item?.className).toMatch(/secondary/);
  });

  it('calls onClick and stops propagation', () => {
    const onClick = vi.fn();

    render(<Button onClick={onClick} aria-label="click-button" />);
    const button = screen.getByLabelText('click-button');

    const event = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    button.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  it('passes additional props to ActionIcon', () => {
    render(<Button aria-label="custom-button" />);
    const button = screen.getByLabelText('custom-button');
    expect(button).toHaveAttribute('aria-label', 'custom-button');
  });
});
