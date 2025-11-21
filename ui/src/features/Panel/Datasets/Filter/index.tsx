/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { Divider, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import Modal from '@/features/Panel/Datasets/Filter/Modal';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

const Filter: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onOpen: () => setOverlay(Overlay.Filter),
  });

  const provider = useMainStore((state) => state.provider);
  const category = useMainStore((state) => state.category);
  const collection = useMainStore((state) => state.collection);

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  useEffect(() => {
    if (overlay !== Overlay.Filter) {
      close();
    }
  }, [overlay]);

  const handleClose = () => {
    setOverlay(null);
    close();
  };

  return (
    <>
      <Stack gap="var(--default-spacing)" className={styles.filterBody}>
        {!provider && !category && !collection && <Text ta="center">No filters selected</Text>}
        {provider && (
          <>
            <Text fw={700}>Provider</Text>
            <Text>{provider}</Text>
          </>
        )}
        {provider && (category || collection) && <Divider />}
        {category && (
          <>
            <Text fw={700}>Category</Text>
            <Text>{category.label}</Text>
            <Divider />
          </>
        )}
        {collection && (category || provider) && <Divider />}
        {collection && (
          <>
            <Text fw={700}>Collection</Text>
            <Text>{collection}</Text>
            <Divider />
          </>
        )}
        <Tooltip label="Configure filter values">
          <Button
            size="xs"
            className={styles.filterModalButton}
            variant={Variant.Tertiary}
            onClick={open}
          >
            Configure
          </Button>
        </Tooltip>
      </Stack>
      <Modal open={opened} onClose={handleClose} />
    </>
  );
};

export default Filter;
