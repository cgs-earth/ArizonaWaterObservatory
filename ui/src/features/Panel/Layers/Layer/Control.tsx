/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionIcon, VisuallyHidden } from '@mantine/core';
import Minus from '@/assets/Minus';
import styles from '@/features/Panel/Panel.module.css';
import mainManager from '@/managers/Main.init';
import { Layer } from '@/stores/main/types';

type Props = {
  layer: Layer;
};
export const Control: React.FC<Props> = (props) => {
  const { layer } = props;

  return (
    <ActionIcon
      variant="transparent"
      className={styles.actionIcon}
      onClick={() => mainManager.deleteLayer(layer.id)}
    >
      <Minus />
      <VisuallyHidden>Remove Layer</VisuallyHidden>
    </ActionIcon>
  );
};
