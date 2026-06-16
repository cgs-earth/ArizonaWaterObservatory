/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import Select from '@/components/Select';
import { collectionService } from '@/services/init';
import { Location } from '@/stores/main/types';
import { getParameterUnit } from '@/utils/parameters';
import { TSimplifiedEntry } from '../types';
import { Visualization } from './Visualization';

type Props = {
  locations: Location[];
  from: string;
  to: string;
};

export const Tab: React.FC<Props> = (props) => {
  const { locations, from, to } = props;

  const [activeControls, setActiveControls] = useState<string[]>([]);
  const [activeVisualizations, setActiveVisualizations] = useState<string[]>([]);

  const layerEntries = useMemo(() => {
    // Get All unique layer Id's
    const uniqueLayerIds = [...new Set(locations.map((l) => l.layerId))];

    const layers = uniqueLayerIds
      .map((layerId) => {
        const layer = collectionService.getLayer(layerId);

        if (layer) {
          const datasource = collectionService.getDatasource(layer.datasourceId);
          const { name } = layer;
          const layerLocations = locations
            .filter((location) => location.layerId === layerId)
            .map((location) => location.id);

          const paramObjects = Object.values(datasource?.parameter_names ?? {});

          const parameters = paramObjects
            .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
            .map((object) => ({
              id: object.id,
              name: object.name,
              unit: getParameterUnit(object),
            }));

          return {
            layerId,
            datasourceId: layer.datasourceId,
            name,
            parameters,
            locations: layerLocations,
          };
        }
        return null;
      })
      .filter(Boolean) as TSimplifiedEntry[];

    return layers;
  }, [locations]);

  const handleAllControlsActiveChange = (checked: boolean) => {
    if (checked) {
      setActiveControls(layerEntries.map((entry) => entry.layerId));
    } else {
      setActiveControls([]);
    }
  };

  const handleControlsActiveChange = (layerId: string) => {
    let newActiveControls = activeControls;
    if (activeControls.includes(layerId)) {
      newActiveControls.filter((id) => id !== layerId);
    } else {
      newActiveControls = [...activeControls, layerId];
    }

    setActiveControls(newActiveControls);
  };

  // Mantine selects will fire an onChange event when options change
  // Memoize to prevent unnecessary rerender
  const options = useMemo(
    () =>
      layerEntries.map((entry) => ({
        value: entry.layerId,
        label: entry.name,
      })),
    [layerEntries]
  );

  const allControlsActive = layerEntries.every((entry) => activeControls.includes(entry.layerId));

  return (
    <Stack>
      <Group justify="space-between">
        <Select
          multiple
          label="Layer Visualizations"
          data={options}
          value={activeVisualizations}
          onChange={setActiveVisualizations}
        />
        <Checkbox
          label="Show All Controls"
          checked={allControlsActive}
          indeterminate={!allControlsActive && activeControls.length > 0}
          onChange={(event) => handleAllControlsActiveChange(event.currentTarget.checked)}
        />
      </Group>
      {layerEntries
        .filter((entry) => activeVisualizations.includes(entry.layerId))
        .map((entry) => (
          <Visualization
            key={`compare-tool-layer-visualization-${entry.layerId}`}
            entry={entry}
            from={from}
            to={to}
            areControlsActive={activeControls.includes(entry.layerId)}
            onControlsActiveChange={handleControlsActiveChange}
          />
        ))}
    </Stack>
  );
};
