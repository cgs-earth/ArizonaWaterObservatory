/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Radio, Stack, Title, Tooltip } from '@mantine/core';
import LegendIcon from '@/assets/Legend';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import styles from '@/features/Tools/Tools.module.css';
import useMainStore from '@/stores/main';
import {
  isPredefinedBoundary,
  isSpatialSelectionPredefined,
} from '@/stores/main/slices/spatialSelection';
import { PredefinedBoundary, SpatialSelection as SpatialSelectionType } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

const SpatialSelection: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const spatialSelection = useMainStore((state) => state.spatialSelection);
  const setSpatialSelectionPredefinedBoundary = useMainStore(
    (state) => state.setSpatialSelectionPredefinedBoundary
  );

  const [show, setShow] = useState(false);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.SpatialSelection : null);
    setShow(show);
  };

  const getBoundaryValue = (spatialSelection: SpatialSelectionType | null) => {
    if (spatialSelection && isSpatialSelectionPredefined(spatialSelection)) {
      return spatialSelection.boundary;
    }
  };

  const handleBoundaryChange = (boundary: string) => {
    if (isPredefinedBoundary(boundary)) {
      setSpatialSelectionPredefinedBoundary(boundary);
    }
  };

  useEffect(() => {
    if (overlay !== Overlay.SpatialSelection) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <Popover
      offset={16}
      opened={show}
      onChange={setShow}
      closeOnClickOutside={false}
      classNames={{ dropdown: styles.legendContent }}
      position="bottom-start"
      target={
        <Tooltip label="Change data boundaries" disabled={show}>
          <IconButton
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
          >
            <LegendIcon />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack
          gap="var(--default-spacing)"
          className={`${styles.container} ${styles.legendWrapper}`}
        >
          <Title order={5} size="h3" className={styles.legendTitle}>
            Spatial Selection
          </Title>

          <Radio.Group
            name="favoriteFramework"
            label="Select a boundary for data fetches"
            value={getBoundaryValue(spatialSelection)}
            onChange={handleBoundaryChange}
          >
            <Group gap="var(--default-spacing)">
              <Radio value={PredefinedBoundary.Arizona} label="Arizona" />
              <Radio value={PredefinedBoundary.ColoradoRiverBasin} label="Colorado River Basin" />
            </Group>
          </Radio.Group>
        </Stack>
      }
    />
  );
};

export default SpatialSelection;
