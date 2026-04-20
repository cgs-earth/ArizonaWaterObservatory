/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';

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
    actionRef.current?.();
    actionRef.current = null;
    close();
  };

  return { opened, confirm, close, run };
};
