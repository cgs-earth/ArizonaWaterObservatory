/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { Anchor, Text } from '@mantine/core';

const description = {
  size: 'md',
};

export const glossaryEntries: Array<{ id: string; label: ReactNode; descriptions: ReactNode[] }> = [
  {
    id: 'datasets',
    label: 'Datasets',
    descriptions: [
      <Text {...description}>
        A collection of related data organized around a common source or observation system.
        Datasets will typically include multiple parameters.
      </Text>,
      <Text {...description}>
        <strong>Example:</strong> USGS Streamgages is a <strong>dataset</strong> containing
        parameters such as volumetric discharge.
      </Text>,
    ],
  },
  {
    id: 'parameters',
    label: 'Parameters',
    descriptions: [
      <Text {...description}>
        A specific variable, attribute, or phenomenon that is measured or modeled. Parameters are
        organized with respected datasets.
      </Text>,
      <Text {...description}>
        <strong>Example:</strong> Volumetric discharge is a <strong>parameter</strong> included in
        the USGS Streamgages dataset.
      </Text>,
    ],
  },
  {
    id: 'layers',
    label: 'Layers',
    descriptions: [
      <Text {...description}>
        Layers are interactive instances of selected datasets. Once a dataset is added to your map
        as a layer, you are able to extract the specific parameter (including time extent, if
        applicable) and visualize it on the map.
      </Text>,
    ],
  },
  {
    id: 'api',
    label: (
      <Anchor href="https://asu-awo-pygeoapi-864861257574.us-south1.run.app/" target="_blank">
        API
      </Anchor>
    ),
    descriptions: [
      <Text {...description}>
        This application is powered by an OGC API instance built in a{' '}
        <Anchor href="https://pygeoapi.io/" target="_blank">
          pygeoapi
        </Anchor>{' '}
        server. Click on any "API" links throughout the application to visit the backend page for
        that item.
      </Text>,
    ],
  },
  {
    id: 'links',
    label: 'Links',
    descriptions: [
      <Text {...description}>
        Use the Links modal to retrieve the API requests used to fetch the same data visualized on
        the map and in the charts.
      </Text>,
    ],
  },
  {
    id: 'download',
    label: 'Download',
    descriptions: [
      <Text {...description}>
        Non-spatial attributes associated with a geographic feature. Properties may contain helpful
        information like location names or the date of the last change to underlying data.
      </Text>,
    ],
  },
];
