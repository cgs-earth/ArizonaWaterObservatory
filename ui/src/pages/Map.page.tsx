/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import Button from '@/components/Button';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { DatasourceType } from '@/stores/main/types';

export const MapPage: React.FC = () => {
  const setDatasources = useMainStore((state) => state.setDatasources);

  useEffect(() => {
    setDatasources([
      {
        id: 'test',
        type: DatasourceType.Point,
        name: 'test',
        provider: 'test-provider',
        dateAvailable: new Date().toTimeString(),
        parameters: [],
        category: 'test-category',
        dataset: 'test-dataset',
        dataVisualizations: [],
      },
    ]);
  }, []);

  return (
    <>
      Map Page
      <Button onClick={() => mainManager.createLayer('test')}>Click</Button>
    </>
  );
};
