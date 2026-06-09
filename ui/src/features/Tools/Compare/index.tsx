/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Text, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { useAreDataToolsEnabled } from '@/hooks/useAreDataToolsEnabled';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { Body } from './Body';

const Compare: React.FC = () => {
  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  const { areDataToolsEnabled } = useAreDataToolsEnabled();

  const opened = overlay === Overlay.Compare;

  const handleOpen = () => {
    setOverlay(Overlay.Compare);
  };

  const handleClose = () => {
    setOverlay(null);
  };

  const helpText = (
    <>
      <Text size="sm">Compare data from multiple layers in a shared space.</Text>
      <br />
      <Text size="sm">At least one layer must have viable locations and parameters selected.</Text>
    </>
  );

  return (
    <>
      <Tooltip label={helpText}>
        <Button
          disabled={!areDataToolsEnabled}
          data-disabled={!areDataToolsEnabled}
          size="sm"
          variant={opened ? Variant.Selected : Variant.Secondary}
          onClick={handleOpen}
        >
          Compare
        </Button>
      </Tooltip>
      <Modal size="1222px" opened={opened} onClose={handleClose} className={styles.root}>
        <Body />
      </Modal>
    </>
  );
};

export default Compare;
