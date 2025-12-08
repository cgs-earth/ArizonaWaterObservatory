/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Button from '@/components/Button';
import Menu from '@/components/Menu';
import { Section } from '@/components/Menu/types';

const sections: Section[] = [
  {
    title: 'General',
    items: [
      {
        label: 'Dashboard',
        onClick: vi.fn(),
      },
      {
        label: 'Reports',
        subItems: [
          {
            label: 'Monthly',
            onClick: vi.fn(),
          },
          {
            label: 'Annual',
            onClick: vi.fn(),
          },
        ],
      },
    ],
  },
];

describe('Menu', () => {
  it('renders target button', () => {
    render(<Menu target={<Button>Open</Button>} sections={[]} />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders section labels and items', () => {
    render(<Menu target={<Button>Open</Button>} sections={sections} />);
    // open the menu
    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('calls onClick for action item', () => {
    const dashboardClick = sections[0].items[0] as any;
    render(<Menu target={<Button>Open</Button>} sections={sections} />);
    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByText('Dashboard'));
    expect(dashboardClick.onClick).toHaveBeenCalled();
  });

  it('renders sub-items when clicking a menu item', () => {
    render(<Menu target={<Button>Open</Button>} sections={sections} />);
    fireEvent.click(screen.getByText('Open'));
    fireEvent.mouseOver(screen.getByText('Reports'));
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Annual')).toBeInTheDocument();
  });
});
