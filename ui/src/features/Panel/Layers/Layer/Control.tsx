/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionIcon, Stack, Tooltip } from '@mantine/core';
import Minus from '@/assets/Minus';
import Plus from '@/assets/Plus';
import styles from '@/features/Panel/Panel.module.css';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};
export const Control: React.FC<Props> = (props) => {
  const { layer } = props;

  const length = useMainStore((state) => state.layers).length;
  const updateLayerPosition = useMainStore((state) => state.updateLayerPosition);

  const handlePositionChange = (position: number) => {
    if (position > 0 && position < length + 1) {
      updateLayerPosition(layer.id, position);
      mainManager.reorderLayers();
    }
  };

  const disableUp = layer.position === 1;
  const disableDown = layer.position === length;

  return (
    <Stack gap={4}>
      <Tooltip
        label={
          disableUp
            ? 'This layer is drawn on top of all layers.'
            : 'Move this layer up, drawing it above the layers below.'
        }
        openDelay={500}
      >
        <ActionIcon
          size="sm"
          disabled={disableUp}
          data-disabled={disableUp}
          variant="transparent"
          title="Move layer up"
          className={styles.actionIcon}
          onClick={() => handlePositionChange(layer.position - 1)}
        >
          <Plus />
        </ActionIcon>
      </Tooltip>
      <Tooltip
        label={
          disableDown
            ? 'This layer is drawn on bottom of all layers.'
            : 'Move this layer down, drawing it below the layers above.'
        }
        openDelay={500}
      >
        <ActionIcon
          size="sm"
          variant="transparent"
          title="Move layer down"
          disabled={disableDown}
          data-disabled={disableDown}
          className={styles.actionIcon}
          onClick={() => handlePositionChange(layer.position + 1)}
        >
          <Minus />
        </ActionIcon>
      </Tooltip>
    </Stack>
  );
};
