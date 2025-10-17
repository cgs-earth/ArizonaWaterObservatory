/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import useMainStore from '@/stores/main';
import { Layer as LayerType } from '@/stores/main/types';
import { useEffect, useState } from 'react';

type Props = {
  layer: LayerType;
};

export const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const locations = useMainStore((state) => state.locations);

  const [selectedLocations, setSelectedLocations] = useState();
  const [otherLocations, setSelectedLocations] = useState();

  useEffect(() => {}, [layer]);
};
