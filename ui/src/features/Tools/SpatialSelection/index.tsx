/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChangeEvent, useEffect, useState } from 'react';
import { Divider, Group, Radio, Stack, Text, Title, Tooltip } from '@mantine/core';
import SpatialSelectionIcon from '@/assets/SpatialSelection';
import Checkbox from '@/components/Checkbox';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { Confirm } from '@/features/Tools/SpatialSelection/Confirm';
import styles from '@/features/Tools/Tools.module.css';
import { useConfirmableAction } from '@/hooks/useConfirmableAction';
import { useLoading } from '@/hooks/useLoading';
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

  const hasLayers = useMainStore((state) => state.layers.length > 0);

  const spatialSelection = useMainStore((state) => state.spatialSelection);
  const setSpatialSelectionPredefinedBoundary = useMainStore(
    (state) => state.setSpatialSelectionPredefinedBoundary
  );
  const setSpatialSelectionStrict = useMainStore((state) => state.setSpatialSelectionStrict);

  const confirmAction = useConfirmableAction(hasLayers);

  const { isLoadingGeography } = useLoading();

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

  const getIsStrict = (spatialSelection: SpatialSelectionType | null) => {
    return Boolean(spatialSelection && spatialSelection.strict);
  };

  const applyBoundaryChange = (boundary: string) => {
    if (isPredefinedBoundary(boundary)) {
      setSpatialSelectionPredefinedBoundary(boundary);
    }
  };

  const handleBoundaryChange = (boundary: string) => {
    confirmAction.run(() => applyBoundaryChange(boundary));
  };

  const applyStrictChange = (strict: boolean) => {
    setSpatialSelectionStrict(strict);
  };

  const handleStrictChange = (event: ChangeEvent<HTMLInputElement>) => {
    confirmAction.run(() => applyStrictChange(event.target.checked));
  };

  useEffect(() => {
    if (overlay !== Overlay.SpatialSelection) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <>
      <Confirm
        opened={confirmAction.opened}
        onClose={confirmAction.close}
        onConfirm={confirmAction.confirm}
      />
      <Popover
        offset={16}
        opened={show}
        onChange={setShow}
        closeOnClickOutside={false}
        position="bottom-start"
        target={
          <Tooltip label="Change data boundaries" disabled={show}>
            <IconButton
              variant={show ? Variant.Selected : Variant.Secondary}
              onClick={() => handleShow(!show)}
            >
              <SpatialSelectionIcon />
            </IconButton>
          </Tooltip>
        }
        content={
          <Stack gap="var(--default-spacing)" className={styles.container}>
            <Title order={5} size="h3" className={styles.legendTitle}>
              Spatial Selection
            </Title>
            <Stack gap="calc(var(--default-spacing) / 4)">
              <Radio.Group
                name="favoriteFramework"
                label="Data Boundary"
                value={getBoundaryValue(spatialSelection)}
                onChange={handleBoundaryChange}
              >
                <Group gap="var(--default-spacing)">
                  <Radio
                    disabled={isLoadingGeography}
                    value={PredefinedBoundary.Arizona}
                    label="Arizona"
                  />
                  <Radio
                    disabled={isLoadingGeography}
                    value={PredefinedBoundary.ColoradoRiverBasin}
                    label="Colorado River Basin"
                  />
                </Group>
              </Radio.Group>
              <Text size="sm" c="dimmed">
                Select a boundary for data fetches
              </Text>
            </Stack>
            <Divider size="md" />
            <Checkbox
              label="Strict"
              size="sm"
              disabled={isLoadingGeography || !spatialSelection}
              checked={getIsStrict(spatialSelection)}
              onChange={handleStrictChange}
            />
          </Stack>
        }
      />
    </>
  );
};

export default SpatialSelection;
