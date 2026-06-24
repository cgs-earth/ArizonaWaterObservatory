/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useMemo, useState } from 'react';
import { Group, Stack } from '@mantine/core';
import styles from '@/features/Compare/Compare.module.css';
import Data from '@/features/Compare/Data';
import { Header } from '@/features/Compare/Header';
import Panel from '@/features/Compare/Panel';
import { useAllLocations } from '@/hooks/useAllLocations';
import notificationManager from '@/managers/Notification.init';
import { collectionService, factoryService } from '@/services/init';
import { Layer, Location } from '@/stores/main/types';
import { NotificationVariant } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getParameterUnit } from '@/utils/parameters';
import { TSimplifiedEntry } from './types';

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

  const { layerLocationGroups } = useAllLocations(layers);

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

  const layerEntries = useMemo(() => {
    // Get All unique layer Id's
    const layerEntries = layers
      .map(({ id }) => {
        const layer = collectionService.getLayer(id);

        if (layer) {
          const datasource = collectionService.getDatasource(layer.datasourceId);
          const layerLocations = locations
            .filter((location) => location.layerId === id)
            .map((location) => location.id);

          const paramObjects = Object.values(datasource?.parameter_names ?? {});

          const parameters = paramObjects
            .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
            .map((object) => ({
              id: object.id,
              name: object.name,
              unit: getParameterUnit(object),
            }));

          const collectionType = datasource
            ? getCollectionType(datasource)
            : CollectionType.Unknown;

          return {
            layer,
            parameters,
            collectionType,
            locations: layerLocations,
          };
        }
        return null;
      })
      .filter(Boolean) as TSimplifiedEntry[];

    return layerEntries;
  }, [locations, layers]);

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
          layerEntries={layerEntries}
          layerLocationGroups={layerLocationGroups}
          onLocationAdd={handleLocationAdd}
          onLocationRemove={handleLocationRemove}
          onOpen={() => handlePanelChange(true)}
          onClose={() => handlePanelChange(false)}
        />
        <Data
          layerEntries={layerEntries}
          layerLocationGroups={layerLocationGroups}
          locations={locations}
          panelOpen={panelOpen}
          from={from}
          to={to}
        />
      </Group>
    </Stack>
  );
};
