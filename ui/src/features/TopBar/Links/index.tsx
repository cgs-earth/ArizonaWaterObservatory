/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { Layer } from '@/features/TopBar/Links/Layer';
import styles from '@/features/TopBar/TopBar.module.css';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';

const Links: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => {
      setOverlay(null);
      setLinkLocation(null);
    },
  });

  const layers = useMainStore((store) => store.layers);

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);
  const linkLocation = useSessionStore((store) => store.linkLocation);
  const setLinkLocation = useSessionStore((store) => store.setLinkLocation);

  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    if (overlay !== Overlay.Links) {
      close();
    } else if (!opened) {
      open();
    }
  }, [overlay]);

  useEffect(() => {
    const isEnabled = layers.some((layer) => {
      const datasource = mainManager.getDatasource(layer.datasourceId);
      if (datasource) {
        const collectionType = getCollectionType(datasource);
        if (collectionType === CollectionType.Features) {
          return true;
        } else if ([CollectionType.EDR, CollectionType.EDRGrid].includes(collectionType)) {
          return layer.parameters.length > 0;
        }
      }
      return false;
    });
    setIsEnabled(isEnabled);
  }, [layers]);

  const handleClick = () => {
    setOverlay(Overlay.Links);
  };

  const helpText = (
    <>
      <Text size="sm">Access the API links used to fetch data for each location.</Text>
      <br />
      <Text size="sm">At least one layer must have viable locations and parameters selected.</Text>
    </>
  );

  return (
    <>
      <Tooltip label={helpText}>
        <Button
          disabled={!isEnabled}
          data-disabled={!isEnabled}
          size="sm"
          variant={opened ? Variant.Selected : Variant.Secondary}
          onClick={handleClick}
        >
          Links
        </Button>
      </Tooltip>
      <Modal size="1222px" opened={opened} onClose={close}>
        <Stack gap={0} className={styles.modalBody}>
          <Title order={5} size="h3">
            API Links
          </Title>
          <>
            {layers.map((layer) => (
              <Layer
                key={`links-entry-${layer.name}-${layer.id}`}
                layer={layer}
                linkLocation={linkLocation}
              />
            ))}
          </>
        </Stack>
      </Modal>
    </>
  );
};

export default Links;
