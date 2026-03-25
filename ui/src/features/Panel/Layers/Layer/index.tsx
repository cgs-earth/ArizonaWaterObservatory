/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useEffect, useState } from 'react';
import { ComboboxData, Tabs } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer as LayerType } from '@/stores/main/types';
import { LoadingType, NotificationType } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getRandomHexColor } from '@/utils/hexColor';
import { getParameterUnit } from '@/utils/parameters';
import { Data } from './Tabs/Data';
import { Settings } from './Tabs/Settings';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: LayerType;
};

const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const [name, setName] = useState(layer.name);
  const [color, setColor] = useState(layer.color);
  const [parameters, setParameters] = useState(layer.parameters);
  const [from, setFrom] = useState<string | null>(layer.from);
  const [to, setTo] = useState<string | null>(layer.to);
  const [opacity, setOpacity] = useState(layer.opacity);
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);
  const [paletteDefinition, setPaletteDefinition] = useState(layer.paletteDefinition);

  const [parameterOptions, setParameterOptions] = useState<ComboboxData>();
  const [isLoading, setIsLoading] = useState(false);

  const [tab, setTab] = useState<string | null>();

  const { isFetchingCollections } = useLoading();

  const { getDateInputError } = useLayerValidation(layer, isLoading, {
    name,
    parameters,
    color,
    from,
    to,
    opacity,
    paletteDefinition,
    collectionType,
    parameterOptions,
  });

  useEffect(() => {
    if (isFetchingCollections || parameterOptions) {
      return;
    }

    const collection = mainManager.getDatasource(layer.datasourceId);

    if (collection) {
      const collectionType = getCollectionType(collection);
      setCollectionType(collectionType);

      const paramObjects = Object.values(collection?.parameter_names ?? {});

      const data = paramObjects
        .map((object) => {
          const unit = getParameterUnit(object);

          return {
            label: `${object.name} (${unit})`,
            value: object.id,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
      setParameterOptions(data);
    }
  }, [isFetchingCollections]);

  // If user updates color through the legend, update it here
  useEffect(() => {
    setColor(layer.color);
  }, [layer.color]);

  useEffect(() => {
    setOpacity(layer.opacity);
  }, [layer.opacity]);

  useEffect(() => {
    setPaletteDefinition(layer.paletteDefinition);
  }, [layer.paletteDefinition]);

  useEffect(() => {
    if (color === layer.color) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      layer.name,
      layer.color,
      layer.parameters,
      layer.from,
      layer.to,
      layer.visible,
      opacity,
      layer.paletteDefinition
    );
  }, [color]);

  useEffect(() => {
    if (name === layer.name) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      name,
      layer.color,
      layer.parameters,
      layer.from,
      layer.to,
      layer.visible,
      layer.opacity,
      layer.paletteDefinition
    );
  }, [name]);

  useEffect(() => {
    if (opacity === layer.opacity) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      name,
      color,
      parameters,
      from,
      to,
      layer.visible,
      opacity,
      paletteDefinition
    );
  }, [opacity]);

  useEffect(() => {
    if (collectionType !== CollectionType.EDR || getDateInputError() || from === layer.from) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      layer.name,
      layer.color,
      layer.parameters,
      from,
      layer.to,
      layer.visible,
      opacity,
      paletteDefinition
    );
  }, [from]);

  useEffect(() => {
    if (collectionType !== CollectionType.EDR || getDateInputError() || to === layer.to) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      layer.name,
      layer.color,
      layer.parameters,
      layer.from,
      to,
      layer.visible,
      layer.opacity,
      layer.paletteDefinition
    );
  }, [to]);

  const handleSave = async () => {
    setIsLoading(true);
    const updateName = name !== layer.name ? `${layer.name} -> ${name}` : layer.name;
    const loadingInstance = loadingManager.add(
      `Updating layer: ${updateName}`,
      LoadingType.Locations
    );
    try {
      await mainManager.updateLayer(
        layer,
        name,
        color,
        parameters,
        from,
        to,
        layer.visible,
        opacity,
        paletteDefinition
      );
      notificationManager.show(`Updated layer: ${updateName}`, NotificationType.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationType.Error, 10000);
      }
    } finally {
      loadingManager.remove(loadingInstance);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setName(layer.name);
    setColor(layer.color);
    setParameters(layer.parameters);
    setFrom(layer.from);
    setTo(layer.to);
    setOpacity(layer.opacity);
    setPaletteDefinition(layer.paletteDefinition);
  };

  const handleDelete = () => {
    mainManager.deleteLayer(layer);
    notificationManager.show(`Deleted layer: ${layer.name}`, NotificationType.Success);
  };

  const handleNameChange = (name: LayerType['name']) => setName(name);
  const handleColorChange = (color: LayerType['color']) => {
    setColor(color);
    setPaletteDefinition(null);
  };
  const handleOpacityChange = (opacity: LayerType['opacity']) => setOpacity(opacity);
  const handleFromChange = (from: LayerType['from']) => setFrom(from);
  const handleToChange = (to: LayerType['to']) => setTo(to);
  const handlePaletteDefinitionChange = (paletteDefinition: LayerType['paletteDefinition']) => {
    setPaletteDefinition(paletteDefinition);
  };
  const handlePaletteDefinitionClear = () => {
    setPaletteDefinition(null);
    setColor(typeof layer.color === 'string' ? layer.color : getRandomHexColor());
  };

  const handleParametersChange = (parameters: LayerType['parameters']) => setParameters(parameters);

  const handleTabChange = (tab: string | null) => setTab(tab);

  const showDataTab = [CollectionType.EDRGrid, CollectionType.EDR].includes(collectionType);

  return (
    <Tabs
      value={tab}
      color="var(--asu-color-primary)"
      classNames={{ panel: styles.content }}
      onChange={handleTabChange}
      defaultValue="settings"
    >
      <Tabs.List>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        {showDataTab && <Tabs.Tab value="data">Data</Tabs.Tab>}
      </Tabs.List>
      <Tabs.Panel value="settings">
        <Settings
          layer={layer}
          collectionType={collectionType}
          attributes={{
            name,
            parameters,
            color,
            from,
            to,
            opacity,
          }}
          attributeHandlers={{
            onNameChange: handleNameChange,
            onColorChange: handleColorChange,

            onFromChange: handleFromChange,
            onToChange: handleToChange,
            onOpacityChange: handleOpacityChange,
          }}
        />
      </Tabs.Panel>
      {showDataTab && (
        <Tabs.Panel value="data">
          <Data
            layer={layer}
            isLoading={isLoading}
            parameterOptions={parameterOptions}
            collectionType={collectionType}
            attributes={{
              parameters,
              from,
              to,
              paletteDefinition,
              color,
            }}
            attributeHandlers={{
              onFromChange: handleFromChange,
              onToChange: handleToChange,
              onParametersChange: handleParametersChange,
              onPaletteDefinitionChange: handlePaletteDefinitionChange,
              onPaletteDefinitionClear: handlePaletteDefinitionClear,
            }}
            updateHandlers={{
              onSave: handleSave,
              onDelete: handleDelete,
              onCancel: handleCancel,
            }}
          />
        </Tabs.Panel>
      )}
    </Tabs>
  );
};

export default Layer;
