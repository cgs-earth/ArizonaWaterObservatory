/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Group, Stack, Title } from '@mantine/core';
import Button from '@/components/Button';
import ModalComponent from '@/components/Modal';
import { Variant } from '@/components/types';
import styles from '@/features/Panel/Datasets/Filter/Filter.module.css';
import { Category } from '@/features/Panel/Datasets/Filter/Modal/Category';
import { Provider } from '@/features/Panel/Datasets/Filter/Modal/Provider';
import useMainStore from '@/stores/main';

type Props = {
  open: boolean;
  onClose: () => void;
};

const Modal: React.FC<Props> = (props) => {
  const { open, onClose } = props;

  const provider = useMainStore((state) => state.provider);
  const setProvider = useMainStore((state) => state.setProvider);
  const category = useMainStore((state) => state.category);
  const setCategory = useMainStore((state) => state.setCategory);

  const [localProvider, setLocalProvider] = useState(provider);
  const [localCategory, setLocalCategory] = useState(category);

  const handleSave = () => {
    setProvider(localProvider);
    setCategory(localCategory);
    onClose();
  };

  const handleCancel = () => {
    setLocalProvider(provider);
    setLocalCategory(category);
    onClose();
  };

  // Provider has been changed outside of this modal, reflect the latest
  useEffect(() => {
    setLocalProvider(provider);
  }, [provider]);

  useEffect(() => {
    setLocalCategory(category);
  }, [category]);

  return (
    <ModalComponent size="auto" opened={open} onClose={onClose}>
      <Stack gap="md" className={styles.modalBody}>
        <Title order={5} size="h3">
          Filter
        </Title>
        <Group grow justify="space-between" align="flex-start">
          <Provider provider={localProvider} onChange={setLocalProvider} />
          <Category category={localCategory} onChange={setLocalCategory} provider={localProvider} />
        </Group>
        <Group justify="center">
          <Button size="sm" variant={Variant.Primary} onClick={handleSave}>
            Save
          </Button>
          <Button size="sm" variant={Variant.Tertiary} onClick={handleCancel}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </ModalComponent>
  );
};

export default Modal;
