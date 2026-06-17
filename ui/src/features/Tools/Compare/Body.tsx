/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import styles from '@/features/Tools/Compare/Compare.module.css';
import notificationManager from '@/managers/Notification.init';
import { collectionService, factoryService } from '@/services/init';
import { Layer, Location } from '@/stores/main/types';
import { NotificationVariant } from '@/stores/session/types';
import { getCollectionType } from '@/utils/collection';
import Data from './Data';
import { Header } from './Header';
import Panel from './Panel';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const getLayerTemporalExtent = (layer: Layer): { from: dayjs.Dayjs; to: dayjs.Dayjs } => {
  const datasource = collectionService.getDatasource(layer.datasourceId);
  if (!datasource) {
    notificationManager.show(
      `Unable to locate datasource for layer: ${layer.name}`,
      NotificationVariant.Error
    );

    const to = dayjs();
    const from = to.subtract(1, 'week');

    return {
      from,
      to,
    };
  }

  const collectionType = getCollectionType(datasource);

  const to = factoryService.getTo(datasource);
  const from = factoryService.getFrom(layer.datasourceId, collectionType, to);

  return { from, to };
};

type Props = {
  layers: Layer[];
};

export const Body: React.FC<Props> = (props) => {
  const { layers } = props;

  const [from, setFrom] = useState(dayjs().subtract(1, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [panelOpen, setPanelOpen] = useState(true);

  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    if (layers.length === 0) {
      return;
    }

    const [firstLayer, ...otherLayers] = layers;

    let { to, from } = getLayerTemporalExtent(firstLayer);

    if (otherLayers.length === 0) {
      setFrom(from.format('YYYY-MM-DD'));
      setTo(to.format('YYYY-MM-DD'));
      return;
    }

    for (const layer of otherLayers) {
      const { to: otherTo, from: otherFrom } = getLayerTemporalExtent(layer);

      if (otherFrom.isSameOrAfter(from) && otherFrom.isSameOrBefore(to)) {
        from = otherFrom;
      }
      if (otherTo.isSameOrBefore(to) && otherTo.isSameOrAfter(from)) {
        to = otherTo;
      }
    }

    setFrom(from.format('YYYY-MM-DD'));
    setTo(to.format('YYYY-MM-DD'));
  }, [layers]);

  const handleFromChange = (from: string) => {
    setFrom(from);
  };
  const handleToChange = (to: string) => {
    setTo(to);
  };
  const handleReset = () => {
    // TODO: placeholder
  };

  const handleLocationAdd = (newLocation: Location) => {
    setLocations([...locations, newLocation]);
  };

  const handleLocationRemove = (oldLocation: Location) => {
    const newLocations = locations.filter(
      (location) => location.layerId !== oldLocation.layerId || location.id !== oldLocation.id
    );

    setLocations(newLocations);
  };

  const handlePanelChange = (open: boolean) => {
    setPanelOpen(open);
  };

  return (
    <Stack className={styles.main} p={0} gap={0}>
      <Header
        from={from}
        onFromChange={handleFromChange}
        to={to}
        onToChange={handleToChange}
        onReset={handleReset}
      />
      <Group h="calc(100% - 3.75rem)" gap={0} align="flex-start" wrap="nowrap">
        <Panel
          layers={layers}
          locations={locations}
          onLocationAdd={handleLocationAdd}
          onLocationRemove={handleLocationRemove}
          onOpen={() => handlePanelChange(true)}
          onClose={() => handlePanelChange(false)}
        />
        <Data locations={locations} panelOpen={panelOpen} from={from} to={to} />
      </Group>
    </Stack>
  );
};
