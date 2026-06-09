/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { collectionService } from '@/services/init';
import useMainStore from '@/stores/main';
import { CollectionType, getCollectionType } from '@/utils/collection';

export const useAreDataToolsEnabled = () => {
  const layers = useMainStore((store) => store.layers);

  const [areDataToolsEnabled, setAreDataToolsEnabled] = useState(false);

  useEffect(() => {
    const areDataToolsEnabled = layers.some((layer) => {
      const datasource = collectionService.getDatasource(layer.datasourceId);
      if (datasource) {
        const collectionType = getCollectionType(datasource);
        if (collectionType === CollectionType.Features) {
          return true;
        } else if ([CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType)) {
          return layer.parameters.length > 0;
        }
      }
      return false;
    });
    setAreDataToolsEnabled(areDataToolsEnabled);
  }, [layers]);

  return {
    areDataToolsEnabled,
  };
};
