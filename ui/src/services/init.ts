/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import MainManager from '@/managers/main/Main.manager';
import notificationManager from '@/managers/Notification.init';
import { CollectionService } from '@/services/collection.service';
import { ConfigService } from '@/services/config.service';
import { DataService } from '@/services/data.service';
import { FactoryService } from '@/services/factory.service';
import { FetchService } from '@/services/fetch.service';
import awoService from '@/services/init/awo.init';
import { LocationService } from '@/services/location.service';
import { MapService } from '@/services/map.service';
import { PopupService } from '@/services/popup.service';
import { SpatialService } from '@/services/spatial.service';
import { ValidationService } from '@/services/validation.service';
import useMainStore from '@/stores/main';

export const collectionService = new CollectionService(useMainStore);

export const factoryService = new FactoryService();

export const popupService = new PopupService();

export const fetchService = new FetchService({
  awoService,
  collectionService,
});
export const locationService = new LocationService(useMainStore, {
  collectionService,
  popupService,
});

export const mapService = new MapService(useMainStore, {
  collectionService,
  factoryService,
  locationService,
  popupService,
});

export const spatialService = new SpatialService(useMainStore);

export const validationService = new ValidationService();

export const dataService = new DataService(useMainStore, {
  collectionService,
  factoryService,
  fetchService,
  locationService,
  mapService,
  spatialService,
  validationService,
  notificationManager,
});

export const mainManager = new MainManager(useMainStore, {
  collectionService,
  factoryService,
  fetchService,
  mapService,
  spatialService,
  dataService,
  popupService,
  notificationManager,
});

export const configService = new ConfigService(useMainStore, {
  mapService,
  factoryService,
  mainManager,
});
