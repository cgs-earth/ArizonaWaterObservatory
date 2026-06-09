/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
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
import { Overlay } from '@/stores/session/types';
import { LocationsCheckList } from './Content';
import Button from '@/components/Button';
import { useLocations } from '@/hooks/useLocations';
import { Feature, GeoJsonProperties, Geometry } from 'geojson';


const LayerAreaFilter: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const hasLayers = useMainStore((state) => state.layers.length > 0);

  const layers = useMainStore((state) => state.layers);
  const [validLayers, setValidLayers] = useState<Layer[]>([]);
  const confirmAction = useConfirmableAction(hasLayers);
  const { selectedLocations } = useLocations();
  const [validLocations, setValidLocations] = useState(selectedLocations);
  const [show, setShow] = useState(false);

  const handleClick = () => {

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
    const tempLocations: Array<Feature<Geometry, GeoJsonProperties>> = [];
    for ( const layer of layers) {
       useLocations(layer);
      tempLocations.push(...selectedLocations);
    }
    setValidLocations(tempLocations);
  }, [ validLocations ]);

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
        disabled={validLocations.length === 0}
        data-disabled={validLocations.length === 0}
        variant={Variant.Tertiary}
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
