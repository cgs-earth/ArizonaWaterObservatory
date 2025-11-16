/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import DownloadIcon from '@/assets/Download';
import Button from '@/components/Button';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import styles from '@/features/TopBar/TopBar.module.css';
import { Layer } from '@/stores/main/types';
import { buildItemsUrl } from '@/utils/url';

type Props = {
  collectionId: Layer['datasourceId'];
};

export const Download: React.FC<Props> = (props) => {
  const { collectionId } = props;

  const [show, setShow] = useState(false);

  const handleDownload = (format: 'kml' | 'shp') => {
    const url = buildItemsUrl(collectionId, format);
    const anchor = document.createElement('a');
    anchor.href = url.toString();
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setShow(false);
  };

  return (
    <Box p={8}>
      <Popover
        opened={show}
        onChange={setShow}
        offset={-5}
        withArrow
        classNames={{ dropdown: styles.downloadDropdown }}
        target={
          <Tooltip label="Download this collection in GIS format." disabled={show}>
            <ActionIcon
              size="lg"
              variant="transparent"
              title="Show download menu"
              classNames={{ root: styles.actionIconRoot, icon: styles.actionIcon }}
              onClick={() => setShow(!show)}
            >
              <DownloadIcon />
            </ActionIcon>
          </Tooltip>
        }
        content={
          <Box className={styles.downloadContent}>
            <Text size="sm" fw={700}>
              Download Formats
            </Text>
            <Group mt={8}>
              <Button size="xs" variant={Variant.Primary} onClick={() => handleDownload('kml')}>
                KML
              </Button>
              <Button size="xs" variant={Variant.Primary} onClick={() => handleDownload('shp')}>
                Shapefile
              </Button>
            </Group>
          </Box>
        }
      />
    </Box>
  );
};
