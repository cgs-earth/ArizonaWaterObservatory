/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { Layer } from '@/features/TopBar/Links/Layer';
import styles from '@/features/TopBar/TopBar.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

const Links: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onOpen: () => setOverlay(Overlay.Links),
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

  useEffect(() => {
    if (overlay !== Overlay.Links) {
      close();
    } else {
      open();
    }
  }, [overlay]);

  const helpText = (
    <>
      <Text size="sm">Access the API links used to fetch data for each location.</Text>
      <br />
      <Text size="sm">At least one layer must have viable locations and parameters selected.</Text>
    </>
  );

  const hasParametersSelected = layers.some((layer) => layer.parameters.length > 0);

  return (
    <>
      <Tooltip label={helpText}>
        <Button
          disabled={!hasParametersSelected}
          data-disabled={!hasParametersSelected}
          size="sm"
          variant={opened ? Variant.Selected : Variant.Primary}
          onClick={open}
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
