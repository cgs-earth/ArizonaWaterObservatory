/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';

/**
 * This hook allows developers to add a confirmation step based on the boolean passed to this hook
 *
 * @param {boolean} shouldConfirm - Determines whether this hook should force a confirm() call before running the action

 * @returns An object containing:
 * - `opened`: Whether the confirmation UI should be visible
 * - `run`: Executes an action immediately or defers it until confirmation
 * - `confirm`: Executes the deferred action and closes the confirmation
 * - `close`: Cancels the confirmation without executing the action
 */
export const useConfirmableAction = (shouldConfirm: boolean) => {
  const [opened, { open, close }] = useDisclosure(false);
  const actionRef = useRef<() => void>(null);

  const run = (action: () => void) => {
    if (shouldConfirm) {
      actionRef.current = action;
      open();
    } else {
      action();
    }
  };

  const confirm = () => {
    console.log('I GOT CALLED', actionRef.current);
    actionRef.current?.();
    actionRef.current = null;
    close();
  };

  return { opened, confirm, close, run };
};
