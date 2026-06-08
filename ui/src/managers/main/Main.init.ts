/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MainManager from '@/managers/main/Main.manager';
import useMainStore from '@/stores/main';

const mainManager = new MainManager(useMainStore);

export default mainManager;
