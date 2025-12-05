/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature } from 'geojson';
import { Menu } from '@mantine/core';
import Delete from '@/assets/Delete';
import MapSearch from '@/assets/MapSearch';
import { StringIdentifierCollections } from '@/consts/collections';
import styles from '@/features/Panel/Panel.module.css';
import { useLocations } from '@/hooks/useLocations';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import { getIdStore } from '@/utils/getIdStore';

type Props = {
  layer: Layer;
  handleClick: (feature: Feature) => void;
};

export const LayerSection: React.FC<Props> = (props) => {
  const { layer, handleClick: onClick } = props;

  const locations = useMainStore((state) => state.locations);
  const setLocations = useMainStore((state) => state.setLocations);

  const { selectedLocations } = useLocations(layer);

  const handleDeselectLayer = (layerId: Layer['id']) => {
    const newLocations = locations.filter((location) => location.layerId !== layerId);

    setLocations(newLocations);
  };

  if (selectedLocations.length === 0) {
    return null;
  }

  const useIdStore = StringIdentifierCollections.includes(layer.datasourceId);

  return (
    <Menu.Sub>
      <Menu.Sub.Target>
        <Menu.Sub.Item>
          {layer.name}&nbsp;({selectedLocations.length})
        </Menu.Sub.Item>
      </Menu.Sub.Target>
      <Menu.Sub.Dropdown className={styles.subDropdown}>
        {selectedLocations.map((feature) => (
          <Menu.Item
            leftSection={<MapSearch />}
            key={feature.id as string}
            onClick={() => onClick(feature)}
          >
            {String(useIdStore ? getIdStore(feature) : (feature.id ?? 'Unknown'))}
          </Menu.Item>
        ))}
        <Menu.Item
          leftSection={<Delete />}
          onClick={() => handleDeselectLayer(layer.id)}
          className={styles.deleteLocationsItem}
        >
          Deselect all
        </Menu.Item>
      </Menu.Sub.Dropdown>
    </Menu.Sub>
  );
};
