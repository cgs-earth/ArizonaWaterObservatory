/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { PropsWithChildren } from 'react';
import { Box, ModalContent, ModalOverlay, ModalProps, ModalRoot } from '@mantine/core';
import X from '@/assets/X';
import IconButton from '@/components/IconButton';
import { ExtendedVariant } from '@/components/IconButton/IconButton.types';
import styles from '@/components/Modal/Modal.module.css';

type Props = ModalProps & {
  opened: boolean;
  onClose: () => void;
};

const Modal: React.FC<PropsWithChildren<Props>> = (props) => {
  const { opened, onClose, ...modalProps } = props;
  return (
    <ModalRoot opened={opened} onClose={onClose} {...modalProps}>
      <ModalOverlay />
      <ModalContent classNames={{ content: styles.content }}>
        <IconButton
          size="sm"
          variant={ExtendedVariant.Unstyled}
          onClick={onClose}
          className={styles.closeButton}
        >
          <X />
        </IconButton>
        <Box component="div" className={styles.modalBody}>
          {props.children}
        </Box>
      </ModalContent>
    </ModalRoot>
  );
};

export default Modal;
