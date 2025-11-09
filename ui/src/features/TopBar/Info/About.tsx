/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Box, Group, Stack, Text } from '@mantine/core';
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
    <Stack mt={16}>
      <Box px={8} mb={16}>
        <Text {...paragraph}>
          The Arizona State University Center for Hydrologic Innovations and the Center for
          Geospatial Solutions present the Arizona Water Observatory (AWO) - an open-source,
          map-based platform that aims to enhance situational awareness of Arizona's water
          resources, inform key water-related decisions, and provide stakeholders and partnering
          agencies with actionable insights.{' '}
        </Text>
        <br />
        <Text {...paragraph}>
          The AWO centralizes disparate water data, including ground stations, remote sensing
          products, and cloud-based modeling outputs, and makes them accessible through intuitive
          design, curated visualizations, embedded analytics, and modernized hosting.
        </Text>
        <br />
        <Text {...paragraph}>
          Developed in collaboration with representatives for Arizona’s water science and management
          community, the AWO continues to evolve to meet real-world needs. We invite your feedback
          and participation as we refine and expand the platform.
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
