/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { LineChart as _LineChart } from 'echarts/charts';
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import styles from '@/components/Charts/Charts.module.css';
import { EChartsSeries, PrettyLabel } from '@/components/Charts/types';
import { CoverageChartService } from '@/services/coverageJSON/coverageChart.service';
import { CoverageCollection, CoverageJSON } from '@/services/edr.service';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LegendComponent,
  ToolboxComponent,
  _LineChart,
  CanvasRenderer,
]);

type Props = {
  data: CoverageJSON | CoverageCollection;
  title?: string;
  legend?: boolean;
  filename?: string;
  prettyLabels?: PrettyLabel[];
  theme?: 'light' | 'dark';
  legendEntries?: string[];
};

const LineChart = (props: Props) => {
  const {
    title,
    data,
    legend = false,
    filename,
    prettyLabels = [],
    theme = 'light',
    legendEntries = [],
  } = props;

  const option: echarts.EChartsCoreOption = useMemo(() => {
    const chartData = new CoverageChartService().coverageJSONToSeries(data);
    let { series } = chartData;
    const { x } = chartData;

    if (prettyLabels.length > 0 && prettyLabels.length === series.length) {
      series = series.map((entry) => ({
        ...series,
        type: entry.type,
        data: entry.data,
        name:
          prettyLabels.find((prettyLabel) => prettyLabel.parameter === entry.name)?.label ??
          entry.name,
      })) as EChartsSeries[];
    }

    return {
      title: title ? { text: title } : undefined,
      tooltip: {
        trigger: 'axis',
      },
      legend: legend
        ? {
            data:
              prettyLabels.length > 0
                ? prettyLabels.map((prettyLabel) => prettyLabel.label)
                : legendEntries,
            top: 'bottom',
          }
        : undefined,
      toolbox: {
        feature: {
          saveAsImage: {
            show: true,
            type: 'png',
            name: filename ? filename : title ? title : 'line-chart',
          },
        },
      },
      grid: {
        left: '10%',
        right: '4%',
        top: '12%',
        bottom: '20%',
      },
      xAxis: x,
      yAxis: {
        type: 'value',
      },
      series,
    };
  }, [data, title, legend]);

  return (
    <ReactEChartsCore
      className={styles.smoothTransition}
      style={{
        height: '100%',
        width: '98%',
        marginLeft: '8px',
      }}
      echarts={echarts}
      option={option}
      theme={theme}
      lazyUpdate
    />
  );
};

export default LineChart;
