/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useCallback, useEffect, useState } from 'react';
import { ComboboxData, Tabs } from '@mantine/core';
import { Data } from '@/features/Panel/Layers/Layer/Tabs/Data';
import { Settings } from '@/features/Panel/Layers/Layer/Tabs/Settings';
import { Tools } from '@/features/Panel/Layers/Layer/Tabs/Tools';
import styles from '@/features/Panel/Panel.module.css';
import { useDebounce } from '@/hooks/useDebounce';
import { useLayerValidation } from '@/hooks/useLayerValidation';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import notificationManager from '@/managers/Notification.init';
import { Layer as LayerType } from '@/stores/main/types';
import { LoadingType, NotificationVariant } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';
import { getRandomHexColor } from '@/utils/hexColor';
import { getParameterUnit } from '@/utils/parameters';

dayjs.extend(isSameOrBefore);

type Props = {
  layer: LayerType;
};

const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const [name, setName] = useState(layer.name);
  const debouncedName = useDebounce(name, 300);
  const [color, setColor] = useState(layer.color);
  const debouncedColor = useDebounce(color, 300);
  const [parameters, setParameters] = useState(layer.parameters);
  const [from, setFrom] = useState<string | null>(layer.from);
  const [to, setTo] = useState<string | null>(layer.to);
  const [opacity, setOpacity] = useState(layer.opacity);
  const debouncedOpacity = useDebounce(opacity, 300);
  const [collectionType, setCollectionType] = useState<CollectionType>(CollectionType.Unknown);
  const [paletteDefinition, setPaletteDefinition] = useState(layer.paletteDefinition);

  const [parameterOptions, setParameterOptions] = useState<ComboboxData>();
  const [isLoading, setIsLoading] = useState(false);

  const [tab, setTab] = useState<string | null>();

  const { isFetchingCollections } = useLoading();

  const { showSearchTool, showLabelTool, getDateInputError } = useLayerValidation(
    layer,
    isLoading,
    {
      name,
      parameters,
      color,
      from,
      to,
      opacity,
      paletteDefinition,
      collectionType,
      parameterOptions,
    }
  );

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
    if (debouncedColor === layer.color) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      layer.name,
      debouncedColor,
      layer.parameters,
      layer.from,
      layer.to,
      layer.visible,
      layer.opacity,
      layer.paletteDefinition
    );
  }, [debouncedColor]);

  useEffect(() => {
    if (debouncedName === layer.name) {
      return;
    }

    void mainManager.updateLayer(
      layer,
      debouncedName,
      layer.color,
      layer.parameters,
      layer.from,
      layer.to,
      layer.visible,
      layer.opacity,
      layer.paletteDefinition
    );
  }, [debouncedName]);

  useEffect(() => {
    if (debouncedOpacity === layer.opacity) {
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
      debouncedOpacity,
      layer.paletteDefinition
    );
  }, [debouncedOpacity]);

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
      layer.opacity,
      layer.paletteDefinition
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

    // The user has cleared the dynamic visualization, reset color
    const newColor =
      paletteDefinition === null && typeof color !== 'string'
        ? typeof layer.color === 'string'
          ? layer.color
          : getRandomHexColor()
        : color;

    try {
      await mainManager.updateLayer(
        layer,
        name,
        newColor,
        parameters,
        from,
        to,
        layer.visible,
        opacity,
        paletteDefinition
      );
      notificationManager.show(`Updated layer: ${updateName}`, NotificationVariant.Success);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationVariant.Error, 10000);
      }
      console.error(error);
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
    notificationManager.show(`Deleted layer: ${layer.name}`, NotificationVariant.Success);
  };

  const handleNameChange = useCallback((name: LayerType['name']) => setName(name), [setName]);

  const handleColorChange = useCallback(
    (color: LayerType['color']) => {
      setColor(color);
      setPaletteDefinition(null);
    },
    [setColor, setPaletteDefinition]
  );

  const handleOpacityChange = useCallback(
    (opacity: LayerType['opacity']) => setOpacity(opacity),
    [setOpacity]
  );

  const handleFromChange = useCallback(
    (from: LayerType['from']) => {
      setFrom(from);
    },
    [setFrom]
  );

  const handleToChange = useCallback(
    (to: LayerType['to']) => {
      setTo(to);
    },
    [setTo]
  );

  const handlePaletteDefinitionChange = useCallback(
    (paletteDefinition: LayerType['paletteDefinition']) => {
      setPaletteDefinition(paletteDefinition);
    },
    [setPaletteDefinition]
  );

  const handlePaletteDefinitionClear = useCallback(() => {
    setPaletteDefinition(null);
    // setColor(typeof layer.color === 'string' ? layer.color : getRandomHexColor());
  }, [layer.color, setPaletteDefinition, setColor]);

  const handleParametersChange = useCallback(
    (parameters: LayerType['parameters']) => {
      setParameters(parameters);
    },
    [setParameters]
  );

  const handleTabChange = useCallback(
    (tab: string | null) => {
      setTab(tab);
    },
    [setTab]
  );

  const showDataTab = [CollectionType.EDRGrid, CollectionType.EDR].includes(collectionType);

  const showToolsTab = showSearchTool;

  return (
    <Tabs
      value={tab}
      color="var(--asu-color-primary)"
      classNames={{
        panel: tab === 'tools' ? styles.contentBorder : `${styles.content} ${styles.contentBorder}`,
      }}
      onChange={handleTabChange}
      defaultValue="settings"
    >
      <Tabs.List>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        {showDataTab && <Tabs.Tab value="data">Data</Tabs.Tab>}
        {showToolsTab && <Tabs.Tab value="tools">Tools</Tabs.Tab>}
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
          updateHandlers={{
            onDelete: handleDelete,
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
              onCancel: handleCancel,
            }}
          />
        </Tabs.Panel>
      )}
      {showToolsTab && (
        <Tabs.Panel value="tools">
          <Tools
            showSearchTool={showSearchTool}
            showLabelTool={showLabelTool}
            isLoading={isLoading}
            layer={layer}
          />
        </Tabs.Panel>
      )}
    </Tabs>
  );
};

export default Layer;
