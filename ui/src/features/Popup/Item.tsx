/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Feature } from 'geojson';
import { Box, Group, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Select from '@/components/Select';
import Table from '@/components/Table';
import { Variant } from '@/components/types';
import styles from '@/features/Popup/Popup.module.css';
import { Location as LocationType } from '@/stores/main/types';

type Props = {
  id: string;
  location: LocationType;
  locations: LocationType[];
  feature: Feature;
  handleLocationChange: (id: string | null) => void;
  handleLinkClick: () => void;
};

export const Item: React.FC<Props> = (props) => {
  const { id, location, locations, feature, handleLocationChange, handleLinkClick } = props;

  return (
    <>
      <Box className={styles.tableWrapper}>
        {feature && <Table id={id} size="xs" json={feature.properties} />}
      </Box>
      <Group
        justify="space-between"
        align="flex-end"
        mt="var(--default-spacing)"
        mb="var(--default-spacing)"
      >
        {locations.length > 1 && (
          <Select
            className={styles.locationsDropdown}
            size="xs"
            label="Items"
            searchable
            data={locations.map((location) => location.id)}
            value={location.id}
            onChange={(value, _option) => handleLocationChange(value)}
          />
        )}
        <Box component="span" className={styles.linkButtonWrapper}>
          <Tooltip label="Open this item in the Export modal.">
            <Button size="xs" onClick={handleLinkClick} variant={Variant.Primary}>
              Export
            </Button>
          </Tooltip>
        </Box>
      </Group>
    </>
  );
};
