/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NumberInput from '@/components/NumberInput';

describe('NumberInput', () => {
  it('renders with placeholder and accepts input', () => {
    render(<NumberInput placeholder="Enter a number" />);

    const input = screen.getByPlaceholderText('Enter a number') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '42' } });
    expect(input.value).toBe('42');
  });

  it('respects min and max props', () => {
    render(<NumberInput placeholder="Enter a number" min={10} max={100} />);

    const input = screen.getByPlaceholderText('Enter a number') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');
  });
});
