/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { GeoJsonProperties } from 'geojson';
import { Table as TableComponent, Text, TextProps } from '@mantine/core';
import styles from '@/components/Table/Table.module.css';

type Props = {
  properties: GeoJsonProperties;
  size?: TextProps['size'];
  searchTerm?: string;
};

export const GeoJSONTable: React.FC<Props> = (props) => {
  const { properties, size = 'sm', searchTerm = '' } = props;

  const [filteredProperties, setFilteredProperties] = useState<GeoJsonProperties>(properties);

  useEffect(() => {
    if (searchTerm.length === 0) {
      setFilteredProperties(properties);
    }

    const lower = searchTerm.toLowerCase();
    const filtered = Object.fromEntries(
      Object.entries(properties ?? {}).filter(
        ([key, value]) =>
          key.toLowerCase().includes(lower) || String(value).toLowerCase().includes(lower)
      )
    );

    setFilteredProperties(filtered);
  }, [searchTerm, properties]);

  return (
    <>
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
        {Object.entries(filteredProperties ?? {}).map(([property, value]) => (
          <TableComponent.Tr key={property}>
            <TableComponent.Td className={styles.fitColumn}>
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
    </>
  );
};
