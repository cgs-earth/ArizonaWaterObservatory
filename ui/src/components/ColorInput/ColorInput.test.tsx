/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ColorInput from '@/components/ColorInput';

describe('ColorInput', () => {
  it('renders without crashing', () => {
    render(<ColorInput value="#ff0000" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('displays the correct initial color value', () => {
    render(<ColorInput value="#00ff00" onChange={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('#00ff00');
  });

  it('calls onChange when the color changes', () => {
    const handleChange = vi.fn();
    render(<ColorInput value="#000000" onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    fireEvent.change(input, { target: { value: '#123456' } });

    expect(handleChange).toHaveBeenCalled();
  });
});
