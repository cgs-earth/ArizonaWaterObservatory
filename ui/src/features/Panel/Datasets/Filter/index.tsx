/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { ActionIcon, Box, Group, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Tune from '@/assets/Tune';
import X from '@/assets/X';
import TextInput from '@/components/TextInput';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import Modal from '@/features/Panel/Datasets/Filter/Modal';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { Body } from './Body';

const Filter: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onOpen: () => setOverlay(Overlay.Filter),
  });

  const search = useMainStore((state) => state.search);
  const setSearch = useMainStore((state) => state.setSearch);

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
      <Box className={styles.filterWrapper}>
        <Group className={styles.filterTextWrapper} gap="var(--default-spacing)">
          <TextInput
            placeholder="Search for datasets, parameters, and units"
            value={search ?? ''}
            onChange={(event) => setSearch(event.currentTarget.value)}
            classNames={{ input: styles.searchInput, section: search ? styles.clearSection : '' }}
            {...(search
              ? {
                  rightSection: (
                    <ActionIcon
                      variant="transparent"
                      size={15}
                      title="Clear search term"
                      classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
                      onClick={() => setSearch(null)}
                    >
                      <X />
                    </ActionIcon>
                  ),
                }
              : {})}
          />
          <Tooltip label="Configure filters">
            <ActionIcon
              variant="transparent"
              size="lg"
              title="Open filters modal"
              classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
              onClick={open}
            >
              <Tune />
            </ActionIcon>
          </Tooltip>
        </Group>
        <Body />
      </Box>
      <Modal open={opened} onClose={handleClose} />
    </>
  );
};

export default Filter;
