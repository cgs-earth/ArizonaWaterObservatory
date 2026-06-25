/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import { Box, Tooltip } from '@mantine/core';
import SpatialSelectionIcon from '@/assets/SpatialSelection';
import Accordion from '@/components/Accordion';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import Layer from '@/features/Panel/Layers/Layer';
import { Control } from '@/features/Panel/Layers/Layer/Control';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import styles from '@/features/Panel/Panel.module.css';
import { Confirm } from '@/features/Tools/SpatialSelection/Confirm';
import { useConfirmableAction } from '@/hooks/useConfirmableAction';
import { useLocations } from '@/hooks/useLocations';
import loadingManager from '@/managers/Loading.init';
import notificationManager from '@/managers/Notification.init';
import { factoryService, mainManager } from '@/services/init';
import useMainStore from '@/stores/main';
import { Layer as LayerType } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { LoadingType, NotificationVariant, Overlay } from '@/stores/session/types';
import { isPolygonFeature } from '@/utils/isTypeFeature';

const LayerAreaFilter: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const hasLayers = useMainStore((state) => state.layers.length > 0);

  const layers = useMainStore((state) => state.layers);
  const [validLayers, setValidLayers] = useState<LayerType[]>([]);
  const [validLocations, setValidLocations] = useState<Feature<Geometry, GeoJsonProperties>[]>([]);
  const confirmAction = useConfirmableAction(hasLayers);
  const { selectedLocations, otherLocations } = useLocations(layers);

  const [show, setShow] = useState(false);

  //const { layerLocationGroups } = useAllLocations(validLayers);

  const loadingInstance = useRef<string>(null);

  const { map } = useMap(MAP_ID);

  const handleClick = () => {
    const drawnShapes: Feature<Polygon>[] = [];
    for (const location of selectedLocations) {
      if (isPolygonFeature(location)) {
        drawnShapes.push(location);
      }
    }
    applySpatialFilter(drawnShapes);
  };

  const applySpatialFilter = async (drawnShapes: Feature<Polygon | MultiPolygon>[]) => {
    const message =
      drawnShapes.length > 0 ? 'Applying spatial filters' : 'Clearing spatial filters';

    loadingInstance.current = loadingManager.add(message, LoadingType.Geography);

    try {
      await mainManager.applySpatialFilter(drawnShapes);
    } catch (error) {
      if ((error as Error)?.message) {
        const _error = error as Error;
        notificationManager.show(`Error: ${_error.message}`, NotificationVariant.Error, 10000);
      } else if (typeof error === 'string') {
        notificationManager.show(`Error: ${error}`, NotificationVariant.Error, 10000);
      }
    } finally {
      if (map) {
        for (const layer of validLayers) {
          const layerIds = Object.values(
            factoryService.getLocationsLayerIds(layer.datasourceId, layer.id)
          );
          for (const layerId of layerIds) {
            if (map.getLayer(layerId)) {
              for (const location in selectedLocations) {
                map.setFilter(layerId, ['!in', location, ...selectedLocations]);
              }
            }
          }
        }
        // set filter on all layers matching layerId
        // Check factory service for helper function to get all connected layers
        // apply filter that excludes all locations that are not the selected location
        // remember to check for id_store layers to get correct feature id
        // Clear all filters if no drawn shapes
        // Check for collisions with existing filter logic on layers (should be in the main map component)
      }
      loadingInstance.current = loadingManager.remove(loadingInstance.current);
    }
  };

  useEffect(() => {
    if (overlay !== Overlay.SpatialSelection) {
      setShow(false);
    }
  }, [overlay, selectedLocations]);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.SpatialSelection : null);
    setShow(show);
  };

  useEffect(() => {
    const validLayers = layers.filter((layer) => layer.geometryTypes.includes('Polygon'));
    setValidLayers(validLayers);
  }, [layers]);

  useEffect(() => {
    setValidLocations(validLocations);
  }, [layers, selectedLocations, otherLocations]);

  return (
    <>
      <Confirm
        opened={confirmAction.opened}
        onClose={confirmAction.close}
        onConfirm={confirmAction.confirm}
      />
      <Popover
        offset={16}
        opened={show}
        onChange={setShow}
        closeOnClickOutside={false}
        position="bottom-start"
        target={
          <Tooltip label="Filter From Layers" disabled={show}>
            <IconButton
              variant={show ? Variant.Selected : Variant.Secondary}
              onClick={() => handleShow(!show)}
            >
              <SpatialSelectionIcon />
            </IconButton>
          </Tooltip>
        }
        content={
          <Box className={styles.accordionBody}>
            {validLayers.length > 0 ? (
              [...validLayers]
                .sort((a, b) => a.position - b.position)
                .map((layer) => (
                  <Accordion
                    key={`layers-accordion-${layer.id}`}
                    items={[
                      {
                        id: `layers-accordion-${layer.id}`,
                        title: <Header layer={layer} />,
                        content: (
                          <Layer layer={layer} includedTabs={['search', 'locations']} flatTabs />
                        ),
                        control: <Control layer={layer} />,
                      },
                    ]}
                    variant={Variant.Secondary}
                  />
                ))
            ) : (
              <Fallback />
            )}
            <Button
              size="xs"
              disabled={selectedLocations.length === 0}
              data-disabled={selectedLocations.length === 0}
              variant={Variant.Primary}
              onClick={handleClick}
            >
              Filter
            </Button>
          </Box>
        }
      />
    </>
  );
};

export default LayerAreaFilter;
