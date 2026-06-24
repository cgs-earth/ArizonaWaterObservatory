/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Button } from '@mantine/core';
import Arrow from '@/assets/Arrow';
import styles from '@/components/Collapsible/Collapsible.module.css';

type Props = {
  open: boolean;
  onClick: (open: boolean) => void;
};

export const Toggle: React.FC<Props> = (props) => {
  const { open, onClick } = props;

  return (
    <Button
      variant="default"
      data-open={open}
      className={styles.button}
      onClick={() => onClick(!open)}
      p={0}
      radius={0}
    >
      <Arrow />
    </Button>
  );
};
