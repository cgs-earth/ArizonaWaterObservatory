/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@test-utils';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Checkbox from '@/components/Checkbox';

describe('Checkbox', () => {
  it('renders with default props', () => {
    render(<Checkbox label="Test Checkbox" />);

    expect(screen.getByLabelText('Test Checkbox')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();

    render(<Checkbox label="Clickable Checkbox" onClick={handleClick} />);

    const checkbox = screen.getByLabelText('Clickable Checkbox');
    fireEvent.click(checkbox);

    expect(handleClick).toHaveBeenCalled();
  });

  it('applies custom classNames', () => {
    render(<Checkbox label="Styled Checkbox" />);

    const input = screen.getByRole('checkbox');
    expect(input.className).toContain('input'); // assuming styles.input is applied
  });
});
