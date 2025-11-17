/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import useSessionStore from '@/stores/session';
import WarningManager from './Warning.manager';

const warningManager = new WarningManager(useSessionStore);

export default warningManager;
