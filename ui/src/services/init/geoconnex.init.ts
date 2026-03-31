/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { EDRService } from '@/services/edr.service';

const geoconnexService = new EDRService({
  baseUrl: import.meta.env.VITE_GEOCONNEX_SOURCE,
});

export default geoconnexService;
