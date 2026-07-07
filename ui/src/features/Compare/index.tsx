/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Text, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { Body } from '@/features/Compare/Body';
import styles from '@/features/Compare/Compare.module.css';
import { useAreDataToolsEnabled } from '@/hooks/useAreDataToolsEnabled';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const Compare: React.FC = () => {
  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  const { layers, areDataToolsEnabled } = useAreDataToolsEnabled(true);

  const opened = overlay === Overlay.Compare;

  const handleOpen = () => {
    setOverlay(Overlay.Compare);
  };

  const handleClose = () => {
    setOverlay(null);
  };

  return (
    <>
      <Tooltip
        label={
          <>
            <Text size="sm">Compare data from multiple layers in a shared space.</Text>
            <br />
            <Text size="sm">
              At least one layer must have parameters selected to enable this tool.
            </Text>
          </>
        }
      >
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
      <Modal
        size="100%"
        maw="94.375rem"
        yOffset="1dvh"
        opened={opened}
        onClose={handleClose}
        className={styles.root}
      >
        <Body layers={layers} />
      </Modal>
    </>
  );
};

export default Compare;
