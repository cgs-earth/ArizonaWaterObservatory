/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Feature } from 'geojson';
import { Section } from '@/components/Menu/types';
import { useLocations } from '@/hooks/useLocations';
import useMainStore from '@/stores/main';

type HandleClick = (feature: Feature) => void;

export const useSections = (handleClick: HandleClick) => {
  const layers = useMainStore((state) => state.layers);
  const locations = useMainStore((state) => state.locations);

  // For each layer that has locations, build a section
  const sections: Section[] = useMemo(() => {
    return layers.map((layer) => {
      const { selectedLocations } = useLocations(layer);

      return {
        title: layer.name,
        items: selectedLocations.map((feature) => ({
          label: feature.id ?? 'Unknown',
          onClick: () => handleClick(feature),
        })),
      } as Section;
    });
  }, [layers, locations]);

  return sections;
};
