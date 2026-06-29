/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Table, Text, TextProps } from '@mantine/core';
import { TTypedOption } from '@/features/Charts/types';
import { CoverageChartService } from '@/services/coverageJSON/coverageChart.service';
import { TCategoryAxisOption } from '@/services/coverageJSON/types';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';
import { CoverageRow } from './CoverageRow';

export type Coverage = CoverageCollection | CoverageJSON | (CoverageCollection | CoverageJSON)[];

type Props = {
  id: string;
  coverage: Coverage;
  labels: string[];
  type?: 'Grid' | 'Item' | 'Location';
  size?: TextProps['size'];
  options: TTypedOption[];
};

export const CoverageJSONTable: React.FC<Props> = (props) => {
  const { id, coverage, labels = [], options, size, type = 'Location' } = props;

  const xAxis = useMemo(() => {
    const coverageObjectEmpty = !coverage || (Array.isArray(coverage) && coverage.length === 0);
    if (coverageObjectEmpty) {
      return [];
    }

    const data = Array.isArray(coverage) ? coverage[0] : coverage;

    const { x } = new CoverageChartService().coverageJSONToSeries(data);

    return (x as TCategoryAxisOption)?.data ?? [];
  }, [coverage]);

  return (
    <>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>
            <Text size={size} fw={700}>
              Parameter/Unit
            </Text>
          </Table.Th>
          <Table.Th>
            <Text size={size} fw={700}>
              {type}
            </Text>
          </Table.Th>
          {xAxis.map((axisPoint, index) => (
            <Table.Th key={`${id}-cj-table-th-${index}`}>
              <Text size={size}>{axisPoint}</Text>
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {options.map((option, index) => (
          <CoverageRow
            key={`${id}-cj-table-td-${index}`}
            coverage={coverage}
            labels={labels}
            option={option}
            size={size}
            options={options}
          />
        ))}
      </Table.Tbody>
    </>
  );
};
