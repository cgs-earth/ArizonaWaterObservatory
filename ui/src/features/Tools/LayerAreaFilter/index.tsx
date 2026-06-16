/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Box, Tooltip } from '@mantine/core';
import SpatialSelectionIcon from '@/assets/SpatialSelection';
import Accordion from '@/components/Accordion';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { Control } from '@/features/Panel/Layers/Layer/Control';
import { Fallback } from '@/features/Panel/Layers/Layer/Fallback';
import { Header } from '@/features/Panel/Layers/Layer/Header';
import styles from '@/features/Panel/Panel.module.css';
import { Confirm } from '@/features/Tools/SpatialSelection/Confirm';
import { useConfirmableAction } from '@/hooks/useConfirmableAction';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { LoadingType, NotificationVariant, Overlay } from '@/stores/session/types';
import { LocationsCheckList } from './Content';
import Button from '@/components/Button';
import { useLocations } from '@/hooks/useLocations';
import { Feature, GeoJsonProperties, Geometry, MultiPolygon, Polygon } from 'geojson';
import notificationManager from '@/managers/Notification.init';
import mainManager from '@/managers/Main.init';
import loadingManager from '@/managers/Loading.init';


const LayerAreaFilter: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);
  

  const hasLayers = useMainStore((state) => state.layers.length > 0);

  const layers = useMainStore((state) => state.layers);
  const [validLayers, setValidLayers] = useState<Layer[]>([]);
  const [validLocations, setValidLocations] = useState<Feature<Geometry, GeoJsonProperties>[]>([]);
  const confirmAction = useConfirmableAction(hasLayers);
  const { selectedLocations,otherLocations } = useLocations(layers);
  
  const [show, setShow] = useState(false);

  const loadingInstance = useRef<string>(null);

  const handleClick = () => {
      //applySpatialFilter(validLocations)
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
      loadingInstance.current = loadingManager.remove(loadingInstance.current);
    }
  };

  useEffect(() => {
    if (overlay !== Overlay.SpatialSelection) {
      setShow(false);
    }
  }, [overlay,selectedLocations]);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.SpatialSelection : null);
    setShow(show);
  };

  useEffect(() => {
    const validLayers = layers.filter((layer) => layer.geometryTypes.includes('Polygon'))
    setValidLayers(validLayers);
  }, [ layers ]);
  
  useEffect(() => {
   
   setValidLocations(validLocations);
    
  }, [ layers,selectedLocations,otherLocations ]);

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
                        content: <LocationsCheckList layer={layer} />,
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
