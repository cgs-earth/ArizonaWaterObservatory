/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Group, ModalProps, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';

type Props = Pick<ModalProps, 'opened' | 'onClose'> & {
  onConfirm: () => void;
};

export const Confirm: React.FC<Props> = (props) => {
  const { opened, onClose, onConfirm } = props;
  return (
    <Modal size="lg" title="Confirm" opened={opened} onClose={onClose} centered>
      <Stack p="var(--default-spacing)" gap="calc(var(--default-spacing) * 2)">
        <Text size="lg" mr="auto" fw={700}>
          Confirm
        </Text>
        <Text ml="var(--default-spacing)">
          This action will require refetching data for all layers. This may take some time.
        </Text>
        <Group gap="var(--default-spacing)">
          <Button size="xs" variant={Variant.Primary} onClick={onConfirm}>
            Ok
          </Button>
          <Button size="xs" variant={Variant.Tertiary} onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
