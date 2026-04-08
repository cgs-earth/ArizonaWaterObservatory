/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import Pagination from '@/components/Pagination';
import { Variant } from '@/components/types';

describe('Pagination', () => {
  it('renders with default props', () => {
    render(<Pagination total={5} aria-label="pagination" />);

    const pagination = screen.getByLabelText('pagination');
    expect(pagination).toBeInTheDocument();
  });

  it('applies the correct variant class to controls', () => {
    const { container } = render(<Pagination total={3} variant={Variant.Secondary} />);

    const control = container.querySelector('[data-active]');
    expect(control?.className).toMatch(/secondary/);
  });

  it('calls onClick and stops propagation', () => {
    const onClick = vi.fn();

    render(<Pagination total={3} onClick={onClick} aria-label="pagination-click" />);

    const pagination = screen.getByLabelText('pagination-click');

    const event = new MouseEvent('click', { bubbles: true });
    const stopPropagationSpy = vi.spyOn(event, 'stopPropagation');

    pagination.dispatchEvent(event);

    expect(stopPropagationSpy).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalled();
  });

  it('passes additional props to Pagination root', () => {
    render(<Pagination total={3} aria-label="custom-pagination" data-testid="pagination-root" />);

    const pagination = screen.getByTestId('pagination-root');
    expect(pagination).toHaveAttribute('aria-label', 'custom-pagination');
  });

  it('sets active page styling when page is active', () => {
    const { container } = render(<Pagination total={3} value={2} variant={Variant.Primary} />);

    const activePage = container.querySelector('[data-active="true"]');
    expect(activePage).toBeInTheDocument();
    expect(activePage?.className).toMatch(/primary/);
  });
});
