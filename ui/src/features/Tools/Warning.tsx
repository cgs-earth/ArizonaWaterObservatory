/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import Modal from '@/components/Modal';
import styles from '@/features/Tools/Tools.module.css';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

export const WARNING_KEY = 'awo-warning-modal';

export const Warning: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onOpen: () => setOverlay(Overlay.Warning),
    onClose: () => {
      setOverlay(null);
    },
  });

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  // local state to trigger render cycle
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const showWarning = sessionStorage.getItem(WARNING_KEY);
    if (overlay !== Overlay.Warning) {
      close();
    } else if (!showWarning || showWarning === 'true') {
      open();
    }
  }, [overlay]);

  const handleDontShowClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.currentTarget;
    if (checked) {
      sessionStorage.setItem(WARNING_KEY, 'false');
      setShowWarning(false);
    } else {
      sessionStorage.setItem(WARNING_KEY, 'true');
      setShowWarning(true);
    }
  };

  return (
    <Modal size="sm" opened={opened} onClose={close} centered>
      <Stack className={styles.warningBody} align="center">
        <Text size="lg" mr="auto" fw={700}>
          Notice
        </Text>
        <Text size="md">
          This source requires selecting at least one parameter before any spatial data can be
          rendered.
        </Text>
        <Group justify="space-between" w="100%">
          <Button size="sm" onClick={() => setOverlay(null)}>
            Ok
          </Button>
          <Checkbox
            size="sm"
            checked={!showWarning}
            onChange={(event) => handleDontShowClick(event)}
            label="Don't show again"
          />
        </Group>
      </Stack>
    </Modal>
  );
};
