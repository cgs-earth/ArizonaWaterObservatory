/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import Select from '@/components/Select';
import styles from '@/features/Compare/Compare.module.css';
import { FullscreenButton } from '@/features/Compare/Data/FullscreenButton';
import { Visualization } from '@/features/Compare/Data/Visualization';
import { TSimplifiedEntry } from '@/features/Compare/types';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import { useDataTools } from '@/hooks/useAreDataToolsEnabled';
import { collectionService } from '@/services/init';
import { Location } from '@/stores/main/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getParameterUnit } from '@/utils/parameters';

type Props = {
  locations: Location[];
  layerLocationGroups: LayerLocationGroups;
  from: string;
  to: string;
};

export const Tab: React.FC<Props> = (props) => {
  const { locations, layerLocationGroups, from, to } = props;

  const { layers } = useDataTools(true);

  const [activeControls, setActiveControls] = useState<string[]>([]);
  const [activeVisualizations, setActiveVisualizations] = useState<string[]>([]);

  const element = useRef<HTMLDivElement>(null);

  const layerEntries = useMemo(() => {
    // Get All unique layer Id's
    const layerEntries = layers
      .map(({ id }) => {
        const layer = collectionService.getLayer(id);

        if (layer) {
          const datasource = collectionService.getDatasource(layer.datasourceId);
          const layerLocations = locations
            .filter((location) => location.layerId === id)
            .map((location) => location.id);

          const paramObjects = Object.values(datasource?.parameter_names ?? {});

          const parameters = paramObjects
            .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
            .map((object) => ({
              id: object.id,
              name: object.name,
              unit: getParameterUnit(object),
            }));

          const collectionType = datasource
            ? getCollectionType(datasource)
            : CollectionType.Unknown;

          return {
            layer,
            parameters,
            collectionType,
            locations: layerLocations,
          };
        }
        return null;
      })
      .filter(Boolean) as TSimplifiedEntry[];

    return layerEntries;
  }, [locations, layers]);

  useEffect(() => {
    setActiveControls(activeVisualizations);
  }, [activeVisualizations]);

  useEffect(() => {
    for (const entry of layerEntries) {
      if (entry.locations.length > 0 && !activeVisualizations.includes(entry.layer.id)) {
        setActiveVisualizations([...activeVisualizations, entry.layer.id]);
      }
    }
  }, [layerEntries]);

  const handleAllControlsActiveChange = (checked: boolean) => {
    if (checked) {
      setActiveControls(layerEntries.map((entry) => entry.layer.id));
    } else {
      setActiveControls([]);
    }
  };

  const handleControlsActiveChange = (layerId: string) => {
    let newActiveControls = activeControls;
    if (activeControls.includes(layerId)) {
      newActiveControls = activeControls.filter((id) => id !== layerId);
    } else {
      newActiveControls = [...activeControls, layerId];
    }

    setActiveControls(newActiveControls);
  };

  // Mantine selects will fire an onChange event when options change
  // Memoize to prevent unnecessary rerender
  const options = useMemo(
    () =>
      layers.map((layer) => ({
        value: layer.id,
        label: layer.name,
      })),
    [layers]
  );

  const allControlsActive = layerEntries.every((entry) => activeControls.includes(entry.layer.id));

  return (
    <Stack gap="calc(var(--default-spacing) * 2)" className={styles.tabContent} ref={element}>
      <Group justify="space-between" align="flex-end">
        <Select
          multiple
          classNames={{ input: styles.activeVisualizationDropdown }}
          size="sm"
          label="Layer Visualizations"
          data={options}
          value={activeVisualizations}
          onChange={setActiveVisualizations}
          placeholder="Select..."
        />
        <Group gap="var(--default-spacing)" align="flex-end">
          <Checkbox
            label="Show All Controls"
            mb="0.5rem"
            checked={allControlsActive}
            indeterminate={!allControlsActive && activeControls.length > 0}
            onChange={(event) => handleAllControlsActiveChange(event.currentTarget.checked)}
          />
          {element.current && <FullscreenButton element={element.current} />}
        </Group>
      </Group>
      <Divider size="md" />
      {layerEntries
        .filter((entry) => activeVisualizations.includes(entry.layer.id))
        .map((entry, index) => (
          <Fragment key={`compare-tool-layer-visualization-${entry.layer.id}`}>
            {index > 0 && <Divider size="md" />}
            <Visualization
              entry={entry}
              from={from}
              to={to}
              locationGroup={layerLocationGroups[entry.layer.id]}
              areControlsActive={activeControls.includes(entry.layer.id)}
              onControlsActiveChange={handleControlsActiveChange}
            />
          </Fragment>
        ))}
    </Stack>
  );
};
