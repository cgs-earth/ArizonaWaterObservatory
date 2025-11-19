/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment } from 'react';
import { Divider, List, Stack, Text } from '@mantine/core';
import styles from '@/features/TopBar/TopBar.module.css';

type Bullet = {
  label?: string;
  content: string;
};

type QA = {
  id: string;
  question: string;
  answer: string;
  bullets?: Bullet[];
};

const questions: QA[] = [
  {
    id: 'restrictions',
    question: 'Why do some datasets require me to select a small date range or draw smaller shape?',
    answer:
      'Many of our datasets contain temporal data (forecasts, historical records, real-time monitoring). Some datasets are very data rich and require stricter date ranges with smaller target areas to ensure optimal performance in the browser. Selecting a specific time range and appropriate spatial extent helps reduce the amount of data being fetched and improves loading performance while giving you the exact information you need.',
  },
  {
    id: 'edr',
    question: 'What does OGC EDR mean and why does it matter?',
    answer:
      'OGC Environmental Data Retrieval (EDR) is an international standard for accessing environmental data. This allows AWO to connect directly to authoritative data sources, ensuring you always have access to the most current information without maintaining duplicate datasets.',
  },
  {
    id: 'save',
    question: 'Can I save my map configurations and symbolization?',
    answer:
      'Yes, you can save all map configurations and symbolization. Use the share feature to save all layer configurations as well as your current basemap, zoom, center, pitch and bearing.',
  },
  {
    id: 'no-data',
    question: 'Why do some datasets show "no data available" for my selected area?',
    answer:
      'These are locations that contain numerous scientific measurements for a wide array of parameters that occurred over an extended period of time. They may not contain measurements for all parameters at all possible dates.',
  },
  {
    id: 'dataset-diff',
    question: "What's the difference between point data, gridded data, and vector datasets?",
    answer: 'AWO provides access to multiple types of geospatial data:',
    bullets: [
      {
        label: 'Point/location data',
        content:
          '(like streamgages and SNOTEL sites) represent measurements at specific locations.',
      },
      {
        label: 'Gridded datasets',
        content:
          'provide continuous coverage across a geographic area with values estimated for every cell in the grid, allowing for spatial interpolation and analysis across entire regions.',
      },
      {
        label: 'Vector datasets',
        content:
          '(OGC Features) include spatial features and boundaries that may not contain measurement data.',
      },
    ],
  },
  {
    id: 'update',
    question: 'How often is the data updated?',
    answer:
      'Update frequency varies by dataset. Real-time monitoring data (streamgages, river stage forecasts) updates frequently (hourly to daily), while other datasets like land cover may update annually or less frequently. Each dataset maintains its original update schedule from the source agency.',
  },
  {
    id: 'multi-layer',
    question: 'Why do forecast datasets have multiple layers (Day 1, Day 2, etc.)?',
    answer:
      'Forecast datasets provide predictions at different time horizons. For example, River Stage Forecasts show predicted water levels for multiple days into the future, allowing you to see how conditions are expected to change over time.',
  },
  {
    id: 'compare',
    question: 'Can I compare data from multiple datasets at the same location?',
    answer:
      'Yes, you can add multiple datasets to your layers and toggle them on and off. Additionally, you can download specific sites for datasets for analysis in your own system.',
  },
  {
    id: 'raster',
    question: 'What are the available raster datasets?',
    answer: 'The following raster datasets are available:',
    bullets: [
      {
        content: 'USGS National Map 3D Elevation Program (3DEP)',
      },
      {
        content: 'USGS National Map Land Cover',
      },
    ],
  },
  {
    id: 'grid',
    question: 'What are the available gridded datasets?',
    answer:
      'Gridded datasets provide continuous spatial coverage with estimated values for every cell across a geographic area. The following gridded datasets are available:',
    bullets: [
      {
        label: 'National Water Model Channel Routing Output ',
        content:
          '- contains simulated flow and channel-related variables for river and stream segments, representing the movement of water through the channel network.',
      },
      {
        label: 'National Water Model Land Data Assimilation System Output ',
        content:
          '- aims to produce high quality fields of land surface states and fluxes by integrating satellite and ground-based observational data products.',
      },
      {
        label: 'National Water Model Reach to Reach Routing Output ',
        content:
          '- provides simulated streamflow and related hydrologic variables for millions of individual river and stream reaches across the U.S., representing how water is routed downstream through the national river network.',
      },
      {
        label: 'Parameter-elevation Regressions on Independent Slopes Model (PRISM) ',
        content:
          '- provides high-resolution climate data including precipitation and temperature estimates across complex terrain.',
      },
    ],
  },
];

export const FAQ: React.FC = () => {
  return (
    <Stack
      my="calc(var(--default-spacing) * 2)"
      mx="var(--default-spacing)"
      gap="calc(var(--default-spacing) * 2)"
    >
      {questions.map((question, index) => (
        <Fragment key={`faq-${question.id}`}>
          {index > 0 && <Divider />}
          <Stack gap="calc(var(--default-spacing) / 2)">
            <Text fw={700}>{question.question}</Text>
            <Text className={styles.faqAnswer}>{question.answer}</Text>
            {question.bullets && question.bullets.length && (
              <List className={styles.faqBullets}>
                {question.bullets.map((bullet, index) => (
                  <List.Item key={`faq-${question.id}-bullet-${index}`}>
                    <Text size="sm">
                      {bullet.label && <strong>{bullet.label}&nbsp;</strong>}
                      {bullet.content}
                    </Text>
                  </List.Item>
                ))}
              </List>
            )}
          </Stack>
        </Fragment>
      ))}
    </Stack>
  );
};
