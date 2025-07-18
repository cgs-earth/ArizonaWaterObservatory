/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import './global.css';

import { Providers } from '@/providers';
import { Router } from '@/Router';

export default function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}
