/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Group, Stack, Text, Title } from '@mantine/core';
import Plus from '@/assets/Plus';
import Checkbox from '@/components//Checkbox';
import Accordion from '@/components/Accordion';
import { Item } from '@/components/Accordion/Accordion.types';
import { Variant } from '@/components/types';
import IconButton from '../IconButton';

export default {
  title: 'Accordion',
};

const items: Item[] = [
  {
    id: 'item 1',
    title: 'item 1',
    content: 'item 1 - content',
  },
  {
    id: 'item 2',
    title: <h1>item 2</h1>,
    content: <div style={{ backgroundColor: 'green' }}>item 2 - rich content</div>,
  },
  {
    id: 'item 3',
    title: (
      <Box>
        <Group>
          <Checkbox />
          <Stack justify="center" gap={1}>
            <Title order={3}>SensorThings 1</Title>
            <Text fw={700} size="sm">
              Filtered
            </Text>
            <Text size="xs">02/03/2020 - 02/03/2021</Text>
          </Stack>
          <IconButton ml="auto" mr="md">
            <Plus />
          </IconButton>
        </Group>
      </Box>
    ),
    content: (
      <Accordion
        items={[
          {
            id: 'sub item 1',
            title: 'sub item 1',
            content: 'sub item 1 - content',
          },
        ]}
        variant={Variant.Secondary}
      />
    ),
  },
];

export const Usage = () => <Accordion items={items} />;
export const Primary = () => <Accordion items={items} variant={Variant.Primary} />;
export const Secondary = () => <Accordion items={items} variant={Variant.Secondary} />;
export const Tertiary = () => <Accordion items={items} variant={Variant.Tertiary} />;
