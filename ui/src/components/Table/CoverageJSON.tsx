/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { Table, Text, TextProps } from '@mantine/core';
import { TTypedOption } from '@/features/Charts/types';
import { CoverageChartService } from '@/services/coverageJSON/coverageChart.service';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';
import { CoverageRow } from './CoverageRow';

export type Coverage = CoverageCollection | CoverageJSON | (CoverageCollection | CoverageJSON)[];

type Props = {
  coverage: Coverage;
  labels: string[];
  type: 'Grid' | 'Item' | 'Location';
  size?: TextProps['size'];
  options: TTypedOption[];
};

export const CoverageJSONTable: React.FC<Props> = (props) => {
  const { coverage, labels = [], options, size, type = 'Location' } = props;

  const xAxis = useMemo(() => {
    const data = Array.isArray(coverage) ? coverage[0] : coverage;

    const { x } = new CoverageChartService().coverageJSONToSeries(data);

    return x?.data ?? [];
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
          {xAxis.map((axisPoint) => (
            <Table.Th>
              <Text size={size}>{axisPoint}</Text>
            </Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {options.map((option, index) => (
          <CoverageRow coverage={coverage} labels={labels} option={option} size={size} />
        ))}
      </Table.Tbody>
    </>
  );
};
