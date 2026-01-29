/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { ActionIcon, List, Tooltip } from '@mantine/core';
import AddLocation from '@/assets/AddLocation';
import { CollectionRestrictions, RestrictionType } from '@/consts/collections';
import styles from '@/features/Panel/Panel.module.css';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import warningManager from '@/managers/Warning.init';
import { ICollection } from '@/services/edr.service';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';

type Props = {
  dataset: ICollection;
  parameters: Layer['parameters'];
  isParameterSelectionOverLimit: boolean;
};

export const Control: React.FC<Props> = (props) => {
  const { dataset, parameters, isParameterSelectionOverLimit } = props;

  const layerCount = useMainStore((state) => state.layers.length);

  const { isLoadingGeography } = useLoading();

  const [isLoading, setIsLoading] = useState(false);

  const [hasLayers, setHasLayers] = useState(false);

  const controller = useRef<AbortController | null>(null);
  const isMounted = useRef(false);

  const handleClick = async (name: string, id: ICollection['id']) => {
    const loadingInstance = loadingManager.add(`Creating layer for: ${name}`, LoadingType.Data);
    setIsLoading(true);

    try {
      controller.current = new AbortController();

      const restrictions = CollectionRestrictions[id] ?? [];

      const collectionType = getCollectionType(dataset);

      if (collectionType === CollectionType.EDRGrid) {
        restrictions.push({
          type: RestrictionType.ParameterFirst,
          message: 'Select at least one parameter before any spatial data can be rendered.',
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

      await mainManager.createLayer(id, parameters, controller.current.signal);
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  useEffect(() => {
    const hasLayers = mainManager.getDatasourceCount(dataset.id) > 0;
    setHasLayers(hasLayers);
  }, [layerCount]);

  const atLayerLimit = layerCount === 10;
  const isControlDisabled =
    atLayerLimit || isLoading || isLoadingGeography || isParameterSelectionOverLimit;

  const getTooltipLabel = () => {
    if (atLayerLimit) {
      return 'At layer limit. Please remove layers before adding any new layers.';
    }

    if (isLoading) {
      return 'Please wait until layer creation has finished.';
    }

    if (isLoadingGeography) {
      return 'Please wait until spatial filters are applied.';
    }

    if (isParameterSelectionOverLimit) {
      return 'Please remove parameters over limit.';
    }

    return 'Add an instance of this dataset as an interactive layer';
  };

  return (
    <Tooltip label={getTooltipLabel()} openDelay={500}>
      <ActionIcon
        size="lg"
        variant="transparent"
        title="Add Layer"
        classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
        className={hasLayers ? styles.hasLayers : undefined}
        disabled={isControlDisabled}
        data-disabled={isControlDisabled}
        onClick={() => handleClick(dataset.title ?? dataset.id, dataset.id)}
      >
        <AddLocation />
      </ActionIcon>
    </Tooltip>
  );
};
