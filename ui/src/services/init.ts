/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { CollectionService } from '@/services/collection.service';
import { ConfigService } from '@/services/config.service';
import { DataService } from '@/services/data.service';
import { FactoryService } from '@/services/factory.service';
import { FetchService } from '@/services/fetch.service';
import { LocationService } from '@/services/location.service';
import { MapService } from '@/services/map.service';
import { SpatialService } from '@/services/spatial.service';
import { ValidationService } from '@/services/validation.service';
import useMainStore from '@/stores/main';

export const collectionService = new CollectionService(useMainStore);

export const configService = new ConfigService(useMainStore);

export const dataService = new DataService(useMainStore);

export const factoryService = new FactoryService();

export const fetchService = new FetchService();

export const locationService = new LocationService(useMainStore);

export const mapService = new MapService(useMainStore);

export const spatialService = new SpatialService(useMainStore);

export const validationService = new ValidationService();
