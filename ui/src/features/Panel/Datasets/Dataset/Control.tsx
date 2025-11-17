/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef } from 'react';
import { ActionIcon, List, Tooltip } from '@mantine/core';
import Map from '@/assets/Map';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import styles from '@/features/Panel/Panel.module.css';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import warningManager from '@/managers/Warning.init';
import { ICollection } from '@/services/edr.service';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';

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

      const restrictions = CollectionRestrictions[id] ?? [];

      const collectionType = getCollectionType(dataset);

      if (collectionType === CollectionType.EDRGrid) {
        restrictions.push({
          type: RestrictionType.ParameterFirst,
          message:
            'This source requires selecting at least one parameter before any spatial data can be rendered.',
        });
      }

      if (restrictions && restrictions.length > 0) {
        const showWarningRestrictions = restrictions.filter(
          (restriction) => !restriction?.noWarning
        );

        // Skip the warning pop up if there are no warnings to show
        // Include all restrictions in the warning if there are
        // other restrictions associated with this collection
        if (showWarningRestrictions.length > 0) {
          const content = (
            <List>
              {restrictions.map((restriction) => (
                <List.Item key={`restriction-${id}-${restriction.type}`}>
                  {restriction.message}
                </List.Item>
              ))}
            </List>
          );

          warningManager.add(id, content);
        }
      }

      await mainManager.createLayer(id, controller.current.signal);
      notificationManager.show(`Added layer for: ${name}`, NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      } else if (typeof error === 'string') {
        notificationManager.show(`Error: ${error}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  return (
    <Tooltip label="Add an instance of this dataset as an interactive layer" openDelay={500}>
      <ActionIcon
        size="lg"
        variant="transparent"
        title="Add Layer"
        classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
        onClick={() => handleClick(dataset.title ?? dataset.id, dataset.id)}
      >
        <Map />
      </ActionIcon>
    </Tooltip>
  );
};
