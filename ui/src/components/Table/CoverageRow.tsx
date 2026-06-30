/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Group, Table, Text, TextProps } from '@mantine/core';
import Arrow from '@/assets/Arrow';
import { EChartsSeries } from '@/components/Charts/types';
import styles from '@/components/Table/Table.module.css';
import { TTypedOption } from '@/features/Charts/types';
import { CoverageChartService } from '@/services/coverageJSON/coverageChart.service';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';

type Coverage = CoverageCollection | CoverageJSON | (CoverageCollection | CoverageJSON)[];

const getCoverageServiceOptions = (option: TTypedOption) =>
  option.type === 'unit' ? { chosenUnit: option.value } : { chosenParameter: option.value };

type Props = {
  coverage: Coverage;
  size?: TextProps['size'];
  labels: string[];
  option: TTypedOption;
  options: TTypedOption[];
};

export const CoverageRow: React.FC<Props> = (props) => {
  const { coverage, labels: seriesLabels, size = 'sm', option, options: allOptions } = props;

  const [showData, setShowData] = useState(true);

  const getFullLabel = (parameter: string, unit?: string) => {
    const option = allOptions
      .filter((opt) => opt.type === 'parameter')
      .find((opt) => opt.value === parameter);

    if (option) {
      return (unit ?? '').length > 0 ? option.label.replace(` (${unit})`, '') : option.label;
    }
    return parameter;
  };

  const series = useMemo(() => {
    const options = getCoverageServiceOptions(option);

    const data = Array.isArray(coverage) ? coverage : [coverage];

    const useSeriesLabels = Array.isArray(seriesLabels) && seriesLabels.length === data.length;

    if (seriesLabels && !useSeriesLabels) {
      console.warn(
        '[CoverageParameterRow] `labels` length does not match `coverage` length; ignoring labels.'
      );
    }

    const allSeries: EChartsSeries[] = [];
    const legendNames: string[] = [];

    data.forEach((entry, coverageIdx) => {
      let { series } = new CoverageChartService().coverageJSONToSeries(entry, options);

      if (useSeriesLabels) {
        const coverageLabel = seriesLabels![coverageIdx];

        series = series.map((s, index) => {
          const finalName =
            option.type === 'unit'
              ? `${getFullLabel(s.name, option.value)} - ${coverageLabel}`
              : coverageLabel;

          const stableId = [
            options.chosenParameter ?? 'param',
            options.chosenUnit ?? 'unit',
            coverageLabel ?? `cov-${coverageIdx}`,
            s.name,
            index,
          ].join('|');

          legendNames.push(finalName);

          return {
            ...s,
            id: stableId,
            name: finalName,
          };
        });
      } else {
        series.forEach((s) => legendNames.push(s.name));
      }

      allSeries.push(...series);
    });

    return allSeries;
  }, [coverage, seriesLabels, option]);

  const handleLabelColumnClick = () => {
    setShowData(!showData);
  };

  return (
    <>
      {showData ? (
        <>
          {series.map((s, rowIdx) => (
            <Table.Tr key={rowIdx}>
              {rowIdx === 0 && (
                <Table.Td
                  rowSpan={series.length}
                  onClick={handleLabelColumnClick}
                  className={`${styles.groupHeader} ${styles.fitColumn}`}
                  data-open
                >
                  <Group justify="space-between" gap="var(--default-spacing)" wrap="nowrap">
                    <Text size={size} fw={700}>
                      {option.label}
                    </Text>
                    <Arrow />
                  </Group>
                </Table.Td>
              )}

              <Table.Td>
                <Text size={size}>{s.name}</Text>
              </Table.Td>

              {s.data.map((d, i) => (
                <Table.Td key={i} className={styles.fitColumn} align="right">
                  <Text size={size} ta="end">
                    {d}
                  </Text>
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </>
      ) : (
        <Table.Tr>
          <Table.Td
            onClick={handleLabelColumnClick}
            className={`${styles.groupHeader} ${styles.fitColumn}`}
            data-closed
          >
            <Group justify="space-between" gap="var(--default-spacing)" wrap="nowrap">
              <Text size={size} fw={700}>
                {option.label}
              </Text>
              <Arrow />
            </Group>
          </Table.Td>
          <Table.Td colSpan={(series?.[0]?.data ?? []).length + 1}>
            <Text size={size}>Expand to see more</Text>
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
};
