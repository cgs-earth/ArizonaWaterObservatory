/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import styles from '@/features/TopBar/TopBar.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { Layer } from './Layer';

const Links: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onOpen: () => setOverlay(Overlay.Share),
  });

  const layers = useMainStore((store) => store.layers);

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  useEffect(() => {
    if (overlay !== Overlay.Share) {
      close();
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
      <Modal size="auto" opened={opened} onClose={close}>
        <Stack gap={0} className={styles.modalBody}>
          <>
            {layers.map((layer) => (
              <Layer layer={layer} />
            ))}
          </>
        </Stack>
      </Modal>
    </>
  );
};

export default Links;
