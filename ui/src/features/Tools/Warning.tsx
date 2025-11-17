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
import warningManager from '@/managers/Warning.init';
import { WARNING_PREFIX } from '@/managers/Warning.manager';
import useSessionStore from '@/stores/session';
import { Overlay, Warning as WarningType } from '@/stores/session/types';

type Props = {
  id: WarningType['id'];
  content: WarningType['content'];
};

export const Warning: React.FC<Props> = (props) => {
  const { id, content } = props;

  const key = `${WARNING_PREFIX}-${id}`;

  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => {
      setOverlay(null);
    },
  });

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  // local state to trigger render cycle
  const [showWarning, setShowWarning] = useState(true);

  useEffect(() => {
    const showWarning = sessionStorage.getItem(key);

    if (overlay !== Overlay.Warning) {
      close();
    } else if (!showWarning || showWarning === 'true') {
      open();
    }
  }, [overlay]);

  const handleClick = () => {
    warningManager.remove(id);
    setOverlay(null);
  };

  const handleClose = () => {
    warningManager.remove(id);
    setOverlay(null);
  };

  const handleDontShowClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.currentTarget;

    if (checked) {
      sessionStorage.setItem(key, 'false');
      setShowWarning(false);
    } else {
      sessionStorage.setItem(key, 'true');
      setShowWarning(true);
    }
  };

  return (
    <Modal size="md" opened={opened} onClose={handleClose} centered>
      <Stack className={styles.warningBody} align="center" gap="var(--default-spacing)">
        <Text size="lg" mr="auto" fw={700}>
          Notice
        </Text>
        <Text size="md">
          This dataset has UI-only restrictions to allow this data to render in browser:
        </Text>
        {content}
        <Group justify="space-between" w="100%">
          <Button size="sm" onClick={() => handleClick()}>
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
