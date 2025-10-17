/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { FeatureCollection } from 'geojson';
import loadingManager from '@/managers/Loading.init';
import awoService from '@/services/init/awo.init';
import useMainStore from '@/stores/main';
import { LoadingType } from '@/stores/session/types';

const Links: React.FC = () => {
  const layers = useMainStore((store) => store.layers);

  const [locationsByCollection, setLocationsByCollection] = useState<Record<
    string,
    FeatureCollection
  > | null>(null);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const handleGenerate = async () => {
    const loadingInstance = loadingManager.add('Generating share config', LoadingType.Locations);
    try {
      controller.current = new AbortController();

      const locations = await awoService.getLocations();

      if (isMounted.current) {
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);
};
