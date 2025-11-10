/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import Popover from '@/components/Popover';

export default {
  title: 'Popover',
};

export const Usage = () => {
  return (
    <Popover
      target={<Button>Show Popover</Button>}
      content={
        <Stack>
          <Text>Popover content</Text>
          <Button>Click me!</Button>
        </Stack>
      }
    />
  );
};
export const Left = () => {
  return (
    <Box style={{ position: 'absolute', right: 0 }}>
      <Popover
        target={<Button>Show Popover</Button>}
        content={
          <Stack>
            <Text>Popover content</Text>
            <Button>Click me!</Button>
          </Stack>
        }
      />
    </Box>
  );
};
export const Right = () => {
  return (
    <Box style={{ position: 'absolute', left: 0 }}>
      <Popover
        target={<Button>Show Popover</Button>}
        content={
          <Stack>
            <Text>Popover content</Text>
            <Button>Click me!</Button>
          </Stack>
        }
      />
    </Box>
  );
};
export const Top = () => {
  return (
    <Box style={{ position: 'absolute', bottom: 0 }}>
      <Popover
        target={<Button>Show Popover</Button>}
        content={
          <Stack>
            <Text>Popover content</Text>
            <Button>Click me!</Button>
          </Stack>
        }
      />
    </Box>
  );
};
