/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Feature } from 'geojson';
import { Stack } from '@mantine/core';
import { Grid } from '@/features/Popup/Grid';
import { Header } from '@/features/Popup/Header';
import { Location } from '@/features/Popup/Location';
import styles from '@/features/Popup/Popup.module.css';
import mainManager from '@/managers/Main.init';
import { Layer, Location as LocationType } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getParameterUnit } from '@/utils/parameters';

export type Parameter = {
  name: string;
  unit: string;
  id: string;
};

type Props = {
  locations: LocationType[];
  features: Feature[];
  close: () => void;
};

const Popup: React.FC<Props> = (props) => {
  const { locations, features } = props;

  const [location, setLocation] = useState<LocationType>(locations[0]);
  const [feature, setFeature] = useState<Feature>();
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);

  const [layer, setLayer] = useState<Layer | null>(null);
  const [datasetName, setDatasetName] = useState<string>('');
  const [parameters, setParameters] = useState<Parameter[]>([]);

  const setLinkLocation = useSessionStore((state) => state.setLinkLocation);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  useEffect(() => {
    const location = locations[0];
    if (location) {
      setLocation(location);
    }
  }, [locations]);

  useEffect(() => {
    if (feature && feature.id === location.id) {
      return;
    }

    const newFeature = features.find((feature) => String(feature.id) === location.id);
    if (newFeature) {
      setFeature(newFeature);
    }
  }, [location]);

  useEffect(() => {
    const newLayer = mainManager.getLayer(location.layerId);
    if (newLayer) {
      setLayer(newLayer);
    }
  }, [location]);

  useEffect(() => {
    if (!layer) {
      return;
    }

    const newDataset = mainManager.getDatasource(layer.datasourceId);

    if (newDataset) {
      setDatasetName(newDataset.title ?? '');
      const paramObjects = Object.values(newDataset?.parameter_names ?? {});

      const parameters = paramObjects
        .filter((object) => object.type === 'Parameter' && layer.parameters.includes(object.id))
        .map((object) => ({ id: object.id, name: object.name, unit: getParameterUnit(object) }));

      setParameters(parameters);

      const collectionType = getCollectionType(newDataset);
      setCollectionType(collectionType);
    }
  }, [location, layer]);

  const handleLinkClick = () => {
    setLinkLocation(location);
    setOverlay(Overlay.Links);
  };

  const handleLocationChange = (id: string | null) => {
    const location = locations.find((location) => location.id === id);
    if (location) {
      setLocation(location);
    }
  };

  if (!layer) {
    return null;
  }

  return (
    <Stack gap={0} className={styles.popupWrapper}>
      <Header id={location.id} name={layer.name} collectionType={collectionType} />

      {collectionType === CollectionType.EDR && feature && datasetName.length > 0 && (
        <Location
          location={location}
          locations={locations}
          feature={feature}
          layer={layer}
          datasetName={datasetName}
          parameters={parameters}
          handleLocationChange={handleLocationChange}
          handleLinkClick={handleLinkClick}
        />
      )}
      {collectionType === CollectionType.EDRGrid && feature && datasetName.length > 0 && (
        <Grid
          location={location}
          locations={locations}
          feature={feature}
          layer={layer}
          datasetName={datasetName}
          parameters={parameters}
          handleLocationChange={handleLocationChange}
          handleLinkClick={handleLinkClick}
        />
      )}
    </Stack>
  );
};

export default Popup;
