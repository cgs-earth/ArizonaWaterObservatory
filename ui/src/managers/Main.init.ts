/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import useMainStore from '@/stores/main';
import MainManager from './Main.manager';

const mainManager = new MainManager(useMainStore);

export default mainManager;
