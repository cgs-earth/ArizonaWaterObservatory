/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActionIcon, Tooltip } from '@mantine/core';
import Minus from '@/assets/Minus';
import styles from '@/features/Panel/Panel.module.css';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer } from '@/stores/main/types';
import { NotificationType } from '@/stores/session/types';

type Props = {
  layer: Layer;
};
export const Control: React.FC<Props> = (props) => {
  const { layer } = props;

  const handleClick = async () => {
    mainManager.deleteLayer(layer);
    notificationManager.show(`Deleted layer: ${layer.name}`, NotificationType.Success);
  };

  return (
    <Tooltip label="Delete this layer instance" openDelay={500}>
      <ActionIcon
        variant="transparent"
        title="Remove layer"
        className={styles.actionIcon}
        onClick={() => handleClick()}
      >
        <Minus />
      </ActionIcon>
    </Tooltip>
  );
};
