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

  return (
    <Stack gap={4}>
      <Tooltip label="Move this layer up, drawing it above the layers below." openDelay={500}>
        <ActionIcon
          size="sm"
          variant="transparent"
          title="Move layer up"
          className={styles.actionIcon}
          onClick={() => handlePositionChange(layer.position - 1)}
        >
          <Plus />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Move this layer down, drawing it below the layers above." openDelay={500}>
        <ActionIcon
          size="sm"
          variant="transparent"
          title="Move layer down"
          className={styles.actionIcon}
          onClick={() => handlePositionChange(layer.position + 1)}
        >
          <Minus />
        </ActionIcon>
      </Tooltip>
    </Stack>
  );
};
