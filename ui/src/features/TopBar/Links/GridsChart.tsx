/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Feature } from 'geojson';
import { Button, Group, Progress, Tooltip } from '@mantine/core';
import DateInput from '@/components/DateInput';
import { DatePreset } from '@/components/DateInput/DateInput.types';
import { StringIdentifierCollections } from '@/consts/collections';
import { Charts } from '@/features/Charts';
import { Parameter } from '@/features/Popup';
import styles from '@/features/TopBar/Links/Links.module.css';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { TZipLink, ZipService } from '@/services/csv.service';
import {
  CoverageCollection,
  CoverageJSON,
  ICollection,
  IGetCubeParams,
} from '@/services/edr.service';
import awoService from '@/services/init/awo.init';
import { Layer } from '@/stores/main/types';
import { NotificationType } from '@/stores/session/types';
import { getIdStore } from '@/utils/getIdStore';
import { getLabel } from '@/utils/getLabel';
import { normalizeBBox } from '@/utils/normalizeBBox';
import { getParameterUnit } from '@/utils/parameters';
import { buildCubeUrl } from '@/utils/url';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: Layer;
  locations: Feature[];
};

export const GridsChart: React.FC<Props> = (props) => {
  const { layer, locations } = props;

  const [from, setFrom] = useState<Layer['from']>(layer.from);
  const [to, setTo] = useState<Layer['to']>(layer.to);
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [progress, setProgress] = useState<number>(0);

  const [isLoading, setIsLoading] = useState(false);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const isStringIdentifierCollection = StringIdentifierCollections.includes(layer.datasourceId);

  const organizedLocations = useMemo(() => {
    return locations.map((location) => {
      const id = String(
        isStringIdentifierCollection ? (getIdStore(location) ?? location.id) : location.id
      );
      const label = layer.label ? (getLabel(location, layer.label) ?? id) : id;
      return { id, label };
    });
  }, [locations]);

  const organizeLabels = () => {
    const labels: Record<string, string> = {};

    for (const location of organizedLocations) {
      labels[location.id] =
        location.label !== location.id ? `${location.label} (${location.id})` : location.label;
    }
    return labels;
  };

  const getData = (
    collectionId: ICollection['id'],
    locationId: string,
    params: IGetCubeParams,
    signal?: AbortSignal
  ) => {
    const location = locations.find(
      (location) =>
        String(
          isStringIdentifierCollection ? (getIdStore(location) ?? location.id) : location.id
        ) === locationId
    );

    if (location) {
      const bbox = location.bbox;
      if (bbox) {
        const normalizedBBox = normalizeBBox(bbox);
        return awoService.getCube<CoverageCollection | CoverageJSON>(collectionId, {
          signal,
          params: { ...params, bbox: normalizedBBox },
        });
      }
    }

    console.error('Location without bbox detected: ', location);

    // Stub collection to resolve type issues
    // This statement should never be reached
    return {
      type: 'CoverageCollection',
      domainType: 'PointSeries',
      coverages: [],
      parameters: {},
    } as CoverageCollection;
  };

  const getId = (feature: Feature) => {
    if (isStringIdentifierCollection) {
      return getIdStore(feature) ?? String(feature.id);
    }

    return String(feature.id);
  };

  const getFileName = (locationId: string, layer: Layer) => {
    let name = `data-${locationId}-${layer.parameters.join('_')}`;

    if (layer.from && dayjs(layer.from).isValid()) {
      name += `-${dayjs(layer.from).format('MM_DD_YYYY')}`;
    }

    if (layer.to && dayjs(layer.to).isValid()) {
      name += `-${dayjs(layer.to).format('MM_DD_YYYY')}`;
    }

    return `${name}.csv`;
  };

  const buildLink = (location: Feature, layer: Layer): TZipLink | undefined => {
    if (!location.bbox) {
      return undefined;
    }

    const url = buildCubeUrl(layer.datasourceId, layer.parameters, from, to, true, true, location);

    const fileName = getFileName(getId(location), layer);
    return { url, fileName };
  };

  const handleGetAllCSV = async () => {
    setIsLoading(true);

    if (!controller.current) {
      controller.current = new AbortController();
    }

    // Create link, exclude locations w/out a bbox
    const links = locations
      .map((location) => buildLink(location, layer))
      .filter(Boolean) as TZipLink[];

    let count = 0;

    const handleEntryProgress = (name: string, loaded: number, total?: number) => {
      console.log(
        `Generated file: ${name}\n File size: ${loaded} bytes${typeof total === 'number' ? `, total zip size: ${total} bytes.` : '.'}`
      );
      const progress = (count / links.length) * 100;
      count += 1;
      if (isMounted.current) {
        setProgress(progress);
      }
    };

    const zipBlob = await new ZipService().getZipFileBlob(links, {
      compressionLevel: 6,
      zip64: true,
      signal: controller.current.signal,
      onEntryProgress: handleEntryProgress,
      onEntryError: (name, error) => {
        notificationManager.show(
          `An error occurred generating file: ${name}. See console for further details.`,
          NotificationType.Error,
          10000
        );
        console.error('Error', name, error);
        return true;
      },
    });

    if (isMounted.current) {
      notificationManager.show("All CSV's generated", NotificationType.Success, 10000);

      const objectUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${layer.datasourceId}-${locations.map((feature) => getId(feature)).join('_')}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(objectUrl);
      a.remove();
      setIsLoading(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const paramObjects = Object.values(collection?.parameter_names ?? {});

      const parameters = paramObjects
        .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
        .map((object) => ({
          id: object.id,
          name: object.observedProperty.label.en,
          unit: getParameterUnit(object),
        }));

      setParameters(parameters);
    }
  }, [layer]);

  const handleFromChange = (from: Layer['from']) => setFrom(from);
  const handleToChange = (to: Layer['to']) => setTo(to);

  const isValidRange = from && to ? dayjs(from).isSameOrBefore(dayjs(to)) : true;

  const disabled = organizedLocations.length === 0 || isLoading || !isValidRange;

  const organizedLabels = useMemo(() => organizeLabels(), [organizedLocations]);

  return (
    <>
      {parameters.length > 0 && (
        <Charts
          collectionId={layer.datasourceId}
          locationIds={organizedLocations.map(({ id }) => id)}
          parameters={parameters}
          from={from}
          to={to}
          coverageLabels={organizedLabels}
          getData={getData}
          className={styles.bigChart}
          tabs
          tabHeight={31.875}
        />
      )}

      <Group w="100%" justify="space-between" align="flex-end">
        <Group gap="calc(var(--default-spacing) * 2)" align="flex-end">
          <DateInput
            label="From"
            size="xs"
            className={styles.datePicker}
            placeholder="Pick start date"
            value={from}
            onChange={handleFromChange}
            simplePresets={[
              DatePreset.OneYear,
              DatePreset.FiveYears,
              DatePreset.TenYears,
              DatePreset.FifteenYears,
              DatePreset.ThirtyYears,
            ]}
            clearable
            error={isValidRange ? false : 'Invalid date range'}
          />
          <DateInput
            label="To"
            size="xs"
            className={styles.datePicker}
            placeholder="Pick end date"
            value={to}
            onChange={handleToChange}
            simplePresets={[
              DatePreset.OneYear,
              DatePreset.FiveYears,
              DatePreset.TenYears,
              DatePreset.FifteenYears,
              DatePreset.ThirtyYears,
            ]}
            clearable
            error={isValidRange ? false : 'Invalid date range'}
          />
        </Group>
        <Tooltip
          label={
            isLoading
              ? 'Please wait for download to finish.'
              : `Download the parameter data for all selected locations in CSV format.`
          }
          multiline
        >
          <Button size="sm" disabled={disabled} data-disabled={disabled} onClick={handleGetAllCSV}>
            Download All
          </Button>
        </Tooltip>
      </Group>
      {isLoading && <Progress w="100%" value={progress} />}
    </>
  );
};
