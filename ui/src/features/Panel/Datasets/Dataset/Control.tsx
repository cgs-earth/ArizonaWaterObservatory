/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import Plus from '@/assets/Plus';
import styles from '@/features/Panel/Panel.module.css';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { ICollection } from '@/services/edr.service';
import { LoadingType, NotificationType } from '@/stores/session/types';

type Props = {
  dataset: ICollection;
};

export const Control: React.FC<Props> = (props) => {
  const { dataset } = props;

  const controller = useRef<AbortController | null>(null);

  const handleClick = async (name: string, id: ICollection['id']) => {
    const loadingInstance = loadingManager.add(`Creating layer for: ${name}`, LoadingType.Data);

    try {
      controller.current = new AbortController();

      await mainManager.createLayer(id, controller.current.signal);
      notificationManager.show(`Added layer for: ${name}`, NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  return (
    <Tooltip label="Add an instance of this dataset as an interactive layer" openDelay={500}>
      <ActionIcon
        variant="transparent"
        title="Add Layer"
        className={styles.actionIcon}
        onClick={() => handleClick(dataset.title ?? dataset.id, dataset.id)}
      >
        <Plus />
      </ActionIcon>
    </Tooltip>
  );
};
