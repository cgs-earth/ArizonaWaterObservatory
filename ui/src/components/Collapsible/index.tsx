/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { PropsWithChildren } from 'react';
import { Box, ButtonProps, Collapse, CollapseProps, Group, GroupProps } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import styles from '@/components/Collapsible/Collapsible.module.css';
import { Toggle } from './Toggle';

type Props = {
  defaultOpen?: boolean;
  groupProps?: GroupProps;
  collapseProps?: Omit<CollapseProps, 'in'>;
  toggleProps?: ButtonProps;
  width: string | number;
  onOpen?: () => void;
  onClose?: () => void;
};

const Collapsible: React.FC<PropsWithChildren<Props>> = (props) => {
  const {
    defaultOpen = true,
    groupProps,
    collapseProps,
    toggleProps,
    width,
    onOpen = () => null,
    onClose = () => null,
    children,
  } = props;

  const [opened, { toggle }] = useDisclosure(defaultOpen, { onOpen, onClose });

  return (
    <Group gap={0} align="flex-start" className={styles.panelGroup} wrap="nowrap" {...groupProps}>
      <Collapse in={opened} transitionDuration={0} className={styles.body} {...collapseProps}>
        <Box style={{ width: opened ? width : 0, maxWidth: opened ? 'unset' : 0, height: '100%' }}>
          {children}
        </Box>
      </Collapse>
      <Toggle open={opened} onClick={toggle} {...toggleProps} />
    </Group>
  );
};

export default Collapsible;
