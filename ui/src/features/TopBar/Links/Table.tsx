/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { GeoJsonProperties } from 'geojson';
import { Table as TableComponent, Text } from '@mantine/core';
import styles from '@/features/TopBar/TopBar.module.css';

type Props = {
  properties: GeoJsonProperties;
  size?: string;
};

export const Table: React.FC<Props> = (props) => {
  const { properties, size = 'sm' } = props;

  return (
    <TableComponent striped stickyHeader withTableBorder withColumnBorders className={styles.table}>
      <TableComponent.Thead>
        <TableComponent.Tr>
          <TableComponent.Th>
            <Text size={size} fw={700}>
              Property
            </Text>
          </TableComponent.Th>
          <TableComponent.Th>
            <Text size={size} fw={700}>
              Value
            </Text>
          </TableComponent.Th>
        </TableComponent.Tr>
      </TableComponent.Thead>
      <TableComponent.Tbody>
        {Object.entries(properties ?? {}).map(([property, value]) => (
          <TableComponent.Tr key={property}>
            <TableComponent.Td className={styles.propertyColumn}>
              <Text size={size} lineClamp={1}>
                {property}
              </Text>
            </TableComponent.Td>
            <TableComponent.Td>
              <Text size={size} lineClamp={2}>
                {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
              </Text>
            </TableComponent.Td>
          </TableComponent.Tr>
        ))}
      </TableComponent.Tbody>
    </TableComponent>
  );
};
