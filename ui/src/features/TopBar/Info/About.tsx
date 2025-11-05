/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Group, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import Checkbox from '@/components/Checkbox';
import { INFO_LOCAL_KEY } from '@/features/TopBar/Info';
import useSessionStore from '@/stores/session';

type Props = {
  showHelp: boolean;
};

export const About: React.FC<Props> = (props) => {
  const { showHelp } = props;

  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [showHelpAgain, setShowHelpAgain] = useState(showHelp);

  const handleDontShowClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.currentTarget;
    if (checked) {
      localStorage.setItem(INFO_LOCAL_KEY, 'false');
      setShowHelpAgain(false);
    } else {
      localStorage.setItem(INFO_LOCAL_KEY, 'true');
      setShowHelpAgain(true);
    }
  };

  return (
    <Stack>
      <Text>This is where we will place the welcome message and application background.</Text>
      <Group justify="space-between">
        <Button size="sm" onClick={() => setOverlay(null)}>
          Continue
        </Button>
        <Checkbox
          size="sm"
          checked={!showHelpAgain}
          onChange={(event) => handleDontShowClick(event)}
          label="Don't show again"
        />
      </Group>
    </Stack>
  );
};
