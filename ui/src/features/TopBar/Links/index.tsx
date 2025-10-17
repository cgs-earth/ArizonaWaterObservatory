/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Stack } from '@mantine/core';
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

  return (
    <>
      <Button size="sm" variant={opened ? Variant.Selected : Variant.Primary} onClick={open}>
        Links
      </Button>
      <Modal size="auto" opened={opened} onClose={close}>
        <Stack className={styles.modalBody} align="center">
          <>
            {layers.map((layer, index) => (
              <Layer layer={layer} open={index === 0} />
            ))}
          </>
        </Stack>
      </Modal>
    </>
  );
};

export default Links;
