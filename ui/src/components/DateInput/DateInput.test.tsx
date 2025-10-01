/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen, userEvent } from '@test-utils';
import { describe, expect, it } from 'vitest';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';

describe('DateInput', () => {
  it('renders without crashing', () => {
    render(<DateInput />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders with simplePresets', () => {
    render(<DateInput simplePresets={[DatePreset.OneYear, DatePreset.FiveYears]} />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('merges simplePresets with custom presets', async () => {
    const customPresets = [{ label: 'Custom Date', value: '2020-01-01' }];

    render(<DateInput simplePresets={[DatePreset.OneYear]} presets={customPresets} />);

    const button = screen.getByRole('button');

    await userEvent.click(button);

    expect(screen.getByText('One year')).toBeInTheDocument();
    expect(screen.getByText('Custom Date')).toBeInTheDocument();
  });

  it('applies custom classNames', () => {
    render(<DateInput />);
    const button = screen.getByRole('button');
    expect(button.className).toMatch(/input/);
  });
});
