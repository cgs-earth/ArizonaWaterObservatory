/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Tools/Tools.module.css';

export const Geocoder: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { map, geocoder } = useMap(MAP_ID);

  useEffect(() => {
    if (!map || !geocoder || !ref.current) {
      return;
    }

    ref.current.innerHTML = '';
    ref.current.appendChild(geocoder.onAdd(map));

    return () => {
      if (ref.current) {
        ref.current = null;
      }
    };
  }, [map, geocoder]);

  return <div ref={ref} className={styles.geocoderWrapper} />;
};
