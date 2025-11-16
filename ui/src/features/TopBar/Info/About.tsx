/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Anchor, Box, Group, Stack, Text } from '@mantine/core';
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

  const paragraph = {
    size: 'md',
  };

  return (
    <Stack mt="calc(var(--default-spacing) * 2)">
      <Box px="var(--default-spacing)" mb="calc(var(--default-spacing) * 2)">
        <Text {...paragraph}>
          The Center for Hydrologic Innovations at Arizona State University and the Center for
          Geospatial Solutions present the Arizona Water Observatory (AWO) - an open-source,
          map-based platform that enhances situational awareness of Arizona's water resources,
          informs water-related decisions, and provides users with actionable insights.
        </Text>
        <br />
        <Text {...paragraph}>
          AWO centralizes water data, including ground stations, remote sensing products, and
          modeling outputs, and makes them accessible through visualizations and embedded analytics.
        </Text>
        <br />
        <Text {...paragraph}>
          Developed in collaboration with representatives for Arizona's water community, and in
          accordance with the{' '}
          <Anchor target="_blank" href="https://internetofwater.org/">
            Internet of Water's
          </Anchor>{' '}
          open water data sharing principles, AWO will continue to evolve to meet real-world water
          needs. We invite your feedback and participation as we refine and expand the platform.
        </Text>
      </Box>
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
