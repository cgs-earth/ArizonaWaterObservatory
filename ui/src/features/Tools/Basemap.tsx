/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Grid, Image, Overlay, Paper, Stack, Text, Title, Tooltip } from '@mantine/core';
import Basemap from '@/assets/Basemap';
import IconButton from '@/components/IconButton';
import { basemaps } from '@/components/Map/consts';
import { BasemapId } from '@/components/Map/types';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import styles from '@/features/Tools/Tools.module.css';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';

export const BasemapSelector: React.FC = () => {
  const basemap = useMainStore((state) => state.basemap);
  const setBasemap = useMainStore((state) => state.setBasemap);

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [show, setShow] = useState(false);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Draw : null);
    setShow(show);
  };

  useEffect(() => {
    if (overlay !== Overlay.Draw) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <Popover
      offset={16}
      opened={show}
      onChange={setShow}
      position="bottom-start"
      target={
        <Tooltip label="Change map styling." disabled={show}>
          <IconButton
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
          >
            <Basemap />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack gap={8} className={styles.container} align="flex-start">
          <Title order={5} size="h3">
            Basemaps
          </Title>
          <Grid className={styles.basemapWrapper} gutter="sm">
            {Object.keys(basemaps)
              .filter((key) =>
                [
                  BasemapId.Streets,
                  BasemapId.SatelliteStreets,
                  BasemapId.Light,
                  BasemapId.Dark,
                ].includes(key as BasemapId)
              )
              .map((key) => {
                const basemapId = key as BasemapId;
                const isSelected = basemap === basemapId;

                return (
                  <Grid.Col span={6} key={basemapId}>
                    <Paper
                      role="radio"
                      id={basemapId}
                      withBorder
                      className={styles.basemapSelector}
                      radius={0}
                      tabIndex={0}
                      onClick={() => setBasemap(basemapId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setBasemap(basemapId);
                        }
                      }}
                      style={{
                        cursor: 'pointer',
                        borderColor: isSelected ? '#4B5563' : '#D1D5DB',
                        backgroundColor: isSelected ? '#F3F4F6' : '#FFFFFF',
                      }}
                    >
                      <Image
                        src={`/basemaps/${basemapId}.png`}
                        alt={`Image for ${basemapId.replace(/-/g, ' ')}`}
                        width="auto"
                        height={55}
                        fit="contain"
                        radius="sm"
                      />
                      <Text
                        component="label"
                        htmlFor={basemapId}
                        mt="xs"
                        mb={0}
                        size="sm"
                        className={styles.capitalize}
                      >
                        {basemapId.replace(/-/g, ' ')}
                      </Text>
                    </Paper>
                  </Grid.Col>
                );
              })}
          </Grid>
        </Stack>
      }
    />
  );
};

export default BasemapSelector;
