/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { collectionService } from '@/services/init';
import useMainStore from '@/stores/main';
import { CollectionType, getCollectionType } from '@/utils/collection';

export const useDataTools = (strict: boolean = false) => {
  const layers = useMainStore((store) => store.layers);

  const validLayers = useMemo(
    () =>
      layers.filter((layer) => {
        const datasource = collectionService.getDatasource(layer.datasourceId);
        if (datasource) {
          const collectionType = getCollectionType(datasource);
          if (!strict && collectionType === CollectionType.Features) {
            return true;
          } else if ([CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType)) {
            return layer.parameters.length > 0;
          }
        }
        return false;
      }),
    [layers, strict]
  );

  const areDataToolsEnabled = validLayers.length > 0;

  return {
    layers: validLayers,
    areDataToolsEnabled,
  };
};
