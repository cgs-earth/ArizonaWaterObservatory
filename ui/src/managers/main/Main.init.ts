/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MainManager from '@/managers/main/Main.manager';
import {
  collectionService,
  dataService,
  factoryService,
  fetchService,
  mapService,
  popupService,
  spatialService,
} from '@/services/init';
import useMainStore from '@/stores/main';
import notificationManager from '../Notification.init';

const mainManager = new MainManager(useMainStore, {
  collectionService,
  factoryService,
  fetchService,
  mapService,
  spatialService,
  dataService,
  popupService,
  notificationManager,
});

export default mainManager;
