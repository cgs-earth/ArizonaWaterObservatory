/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

export const sortObject = <T extends Record<string, unknown> | null>(obj: T): T => {
  if (obj === null) {
    return obj;
  }

  const entries = Object.entries(obj) as [string, unknown][];
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(sorted) as typeof obj;
};
