/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, Ref } from 'react';

export type Item = {
  id: string;
  title: ReactNode;
  content: ReactNode;
  control?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};
