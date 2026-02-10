/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Box, Group, Text } from '@mantine/core';
import CopyInput from '@/components/CopyInput';
import styles from '@/features/TopBar/TopBar.module.css';
import { CollectionType } from '@/utils/collection';

type Props = {
  url: string;
  collectionType: CollectionType;
  isLoading: boolean;
  onGetAllCSV: () => void;
};

export const Header: React.FC<Props> = (props) => {
  const { url, collectionType } = props;

  const getMessage = () => {
    switch (collectionType) {
      case CollectionType.EDR:
        return 'This is the request used to fetch all locations displayed on the map. View requests used to fetch timeseries below.';
      case CollectionType.EDRGrid:
        return 'This is the request used to fetch the initial CoverageJSON data, that is then parsed into a geospatial format to allow interactions on the map. View requests used to fetch individual pointseries below.';
      default:
        return 'This is the request used to fetch all locations displayed on the map. View requests used to fetch individual locations below.';
    }
  };

  return (
    <Box className={styles.header}>
      <Text size="xs" c="dimmed">
        {getMessage()}
      </Text>
      <Group justify="space-between" gap="var(--default-spacing)">
        <CopyInput size="sm" url={url} className={styles.fullWidth} />
        {/* {collectionType === CollectionType.EDR && (
          <Tooltip
            label={
              isLoading
                ? 'Please wait for download to finish.'
                : `Download the parameter data for all selected locations in CSV format.`
            }
            multiline
          >
            <Button size="md" disabled={isLoading} data-disabled={isLoading} onClick={onGetAllCSV}>
              Get All CSV's
            </Button>
          </Tooltip>
        )} */}
      </Group>
    </Box>
  );
};
