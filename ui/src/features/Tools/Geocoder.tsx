/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Tools/Tools.module.css';
import useSessionStore from '@/stores/session';

// IMPORTANT NOTE: geocoder can only support one mounted instance
// if changing screen size between mobile and desktop, the geocoder mounted
// second will not function
export const Geocoder: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { map, geocoder } = useMap(MAP_ID);

  const setOverlay = useSessionStore((state) => state.setOverlay);

  useEffect(() => {
    if (!map || !geocoder || !ref.current) {
      return;
    }

    ref.current.innerHTML = '';
    ref.current.appendChild(geocoder.onAdd(map));

    const clearOverlay = () => setOverlay(null);

    const input = ref.current.querySelector('.mapboxgl-ctrl-geocoder--input');
    if (input) {
      input.addEventListener('focus', clearOverlay);
    }

    return () => {
      if (ref.current) {
        ref.current.innerHTML = '';
        const input = ref.current.querySelector('.mapboxgl-ctrl-geocoder--input');
        if (input) {
          input.removeEventListener('focus', clearOverlay);
        }
        ref.current = null;
      }
    };
  }, [map, geocoder]);

  return <div ref={ref} className={styles.geocoderWrapper} />;
};
