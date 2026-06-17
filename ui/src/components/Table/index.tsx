/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { GeoJsonProperties } from 'geojson';
import { Table as TableComponent, TableProps } from '@mantine/core';
import styles from '@/components/Table/Table.module.css';
import TextInput from '@/components/TextInput';
// TODO: Find a better location for this type
import { TTypedOption } from '@/features/Charts/types';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';
import { isCoverageCollection, isCoverageJSON } from '@/utils/isTypeObject';
import { CoverageJSONTable } from './CoverageJSON';
import { GeoJSONTable } from './GeoJSON';

type Props = TableProps & {
  id: string;
  json?:
    | GeoJsonProperties
    | CoverageJSON
    | CoverageCollection
    | (CoverageJSON | CoverageCollection)[];
  labels?: string[];
  type?: 'Grid' | 'Item' | 'Location';
  options?: TTypedOption[];
  size?: string;
  search?: boolean;
  fixed?: boolean;
};

const isCoverageObjOrArray = (
  object: Props['json']
): object is CoverageJSON | CoverageCollection | (CoverageJSON | CoverageCollection)[] => {
  return Boolean(
    object &&
      (Array.isArray(object)
        ? object.every((obj) => isCoverageCollection(obj) || isCoverageJSON(obj))
        : isCoverageCollection(object) || isCoverageJSON(object))
  );
};

const Table: React.FC<Props> = (props) => {
  const {
    id,
    json = {},
    size = 'sm',
    type,
    labels = [],
    options = [],
    search = false,
    fixed = true,
  } = props;

  const [searchTerm, setSearchTerm] = useState('');

  const isCoverage = isCoverageObjOrArray(json);

  return (
    <>
      {search && (
        <TextInput
          size="xs"
          label="Search Table"
          placeholder="Search property names and values"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.currentTarget.value)}
          mb="var(--default-spacing)"
        />
      )}
      <TableComponent
        striped
        stickyHeader
        withTableBorder
        withColumnBorders
        className={fixed ? styles.fixed : ''}
      >
        {!isCoverage && (
          <GeoJSONTable id={id} searchTerm={searchTerm} properties={json} size={size} />
        )}
        {isCoverage && (
          <CoverageJSONTable
            id={id}
            coverage={json}
            type={type}
            labels={labels}
            options={options}
            size={size}
          />
        )}
      </TableComponent>
    </>
  );
};

export default Table;
