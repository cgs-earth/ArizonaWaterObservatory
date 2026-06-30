/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Divider, Group, Stack } from '@mantine/core';
import Checkbox from '@/components/Checkbox';
import Select from '@/components/Select';
import styles from '@/features/Compare/Compare.module.css';
import { Visualization } from '@/features/Compare/Data/Visualization';
import { TSimplifiedEntry } from '@/features/Compare/types';
import { LayerLocationGroups } from '@/hooks/useAllLocations';
import { useAreDataToolEnabled } from '@/hooks/useAreDataToolsEnabled';

type Props = {
  layerLocationGroups: LayerLocationGroups;
  layerEntries: TSimplifiedEntry[];
  activeVisualizations: string[];
  handleActiveVisualizationsChange: (activeVisualizations: string[]) => void;
  panelOpen: boolean;
  from: string;
  to: string;
};

const Data: React.FC<Props> = (props) => {
  const {
    layerEntries,
    layerLocationGroups,
    activeVisualizations,
    handleActiveVisualizationsChange,
    panelOpen,
    from,
    to,
  } = props;

  const { layers } = useAreDataToolEnabled(true);

  const [activeControls, setActiveControls] = useState<string[]>([]);

  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveControls(activeVisualizations);
  }, [activeVisualizations]);

  useEffect(() => {
    for (const entry of layerEntries) {
      if (entry.locations.length > 0 && !activeVisualizations.includes(entry.layer.id)) {
        handleActiveVisualizationsChange([...activeVisualizations, entry.layer.id]);
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
    <Box
      className={`${styles.dataWrapper} ${panelOpen ? styles.dataWrapperPartial : styles.dataWrapperFull}`}
    >
      <Stack gap="calc(var(--default-spacing) * 2)" className={styles.tabContent} ref={element}>
        <Group justify="space-between" align="flex-end">
          <Select
            multiple
            classNames={{ input: styles.activeVisualizationDropdown }}
            size="sm"
            label="Layer Visualizations"
            data={options}
            value={activeVisualizations}
            onChange={handleActiveVisualizationsChange}
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
    </Box>
  );
};

export default Data;
