/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Select from '@/components/Select';

describe('Select', () => {
  const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ];

  it('renders with given props', () => {
    render(<Select data={options} placeholder="Pick a fruit" />);
    expect(screen.getByPlaceholderText('Pick a fruit')).toBeInTheDocument();
  });

  it('opens dropdown and selects an option', async () => {
    render(<Select data={options} placeholder="Pick a fruit" />);

    const input = screen.getByPlaceholderText('Pick a fruit');
    fireEvent.mouseDown(input); // open dropdown

    const option = await screen.findByText('Banana');
    fireEvent.click(option);

    expect(screen.getByDisplayValue('Banana')).toBeInTheDocument();
  });
});
