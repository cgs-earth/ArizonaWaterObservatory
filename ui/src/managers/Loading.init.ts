/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import useSessionStore from '@/stores/session';
import LoadingManager from './Loading.manager';

const loadingManager = new LoadingManager(useSessionStore);

export default loadingManager;
