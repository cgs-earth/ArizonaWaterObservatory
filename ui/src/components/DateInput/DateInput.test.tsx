/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { describe, expect, it } from 'vitest';
import DateInput from '@/components/DateInput';

describe('DateInput', () => {
  it('renders without crashing', () => {
    render(<DateInput data-testid="test-input" />);
    screen.getByTestId;
    const input = screen.getByTestId('test-input');
    expect(input).toBeInTheDocument();
  });

  // it('renders with simplePresets', () => {
  //   render(<DateInput simplePresets={[DatePreset.OneYear, DatePreset.FiveYears]} />);
  //   const button = screen.getByRole('button');
  //   expect(button).toBeInTheDocument();
  // });

  // it('merges simplePresets with custom presets', async () => {
  //   render(<DateInput simplePresets={[DatePreset.OneYear]} />);

  //   const button = screen.getByRole('button');

  //   await userEvent.click(button);

  //   expect(screen.getByText('One year')).toBeInTheDocument();
  //   expect(screen.getByText('Custom Date')).toBeInTheDocument();
  // });

  // it('applies custom classNames', () => {
  //   render(<DateInput />);
  //   const button = screen.getByRole('button');
  //   expect(button.className).toMatch(/input/);
  // });
});
