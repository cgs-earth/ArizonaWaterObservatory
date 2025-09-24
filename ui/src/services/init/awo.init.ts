/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { EDRService } from '@/services/edr.service';

const awoService = new EDRService({
  baseUrl: import.meta.env.VITE_AWO_SOURCE,
});

export default awoService;
