/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { bbox } from '@turf/turf';
import { Feature } from 'geojson';
import { LngLatBoundsLike } from 'mapbox-gl';
import { MenuItem, MenuLabel, Tooltip } from '@mantine/core';
import Delete from '@/assets/Delete';
import Button from '@/components/Button';
import Menu from '@/components/Menu';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Panel/Panel.module.css';
import useMainStore from '@/stores/main';
import { LayerSection } from './LayerSection';

const Locations: React.FC = () => {
  const [show, setShow] = useState(false);

  const layers = useMainStore((state) => state.layers);
  const hasLocations = useMainStore((state) => state.locations.length > 0);
  const setLocations = useMainStore((state) => state.setLocations);

  const { map } = useMap(MAP_ID);

  const handleFeatureClick = (feature: Feature) => {
    if (!map) {
      return;
    }

    const bounds = bbox(feature) as LngLatBoundsLike;
    map!.fitBounds(bounds, {
      padding: 40,
      speed: 3,
    });
  };

  const handleDeleteAll = () => {
    setLocations([]);
  };

  return (
    <Menu
      opened={show}
      onChange={setShow}
      target={
        <Tooltip
          label={hasLocations ? 'Manage selected locations' : 'Click on a location to select it'}
        >
          <Button
            size="sm"
            mr="var(--default-spacing)"
            disabled={!hasLocations}
            data-disabled={!hasLocations}
            variant={show ? Variant.Selected : Variant.Secondary}
          >
            Locations
          </Button>
        </Tooltip>
      }
    >
      <MenuLabel>Layers</MenuLabel>
      {layers.map((layer) => (
        <LayerSection
          key={`locations-control-${layer.id}`}
          layer={layer}
          handleClick={handleFeatureClick}
        />
      ))}
      <MenuItem
        leftSection={<Delete />}
        onClick={handleDeleteAll}
        className={styles.deleteLocationsItem}
      >
        Deselect locations for all layers
      </MenuItem>
    </Menu>
  );
};

export default Locations;
