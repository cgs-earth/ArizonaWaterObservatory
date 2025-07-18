/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TextInput from '@/components/TextInput';

describe('TextInput', () => {
  it('renders with placeholder and accepts input', () => {
    render(<TextInput placeholder="Enter text" />);

    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Hello world' } });
    expect(input.value).toBe('Hello world');
  });

  it('renders with a default value', () => {
    render(<TextInput defaultValue="Initial value" />);
    const input = screen.getByDisplayValue('Initial value');
    expect(input).toBeInTheDocument();
  });
});
