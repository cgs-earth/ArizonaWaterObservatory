/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@test-utils';
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Modal from '@/components/Modal';

describe('Modal component', () => {
  it('renders children when opened is true', () => {
    const opened = true;

    render(
      <Modal opened={opened} onClose={() => {}}>
        <div>Modal Content</div>
      </Modal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render children when opened is false', () => {
    render(
      <Modal opened={false} onClose={() => {}}>
        <div>Hidden Content</div>
      </Modal>
    );

    expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();

    const opened = true;

    render(
      <Modal opened={opened} onClose={onClose}>
        <div>Close Test</div>
      </Modal>
    );

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
