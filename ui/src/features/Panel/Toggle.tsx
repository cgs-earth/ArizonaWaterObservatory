/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dispatch, SetStateAction, useEffect } from 'react';
import { Button } from '@mantine/core';
import Arrow from '@/assets/Arrow';
import { useMap } from '@/contexts/MapContexts';
import { MAP_ID } from '@/features/Map/config';
import styles from '@/features/Panel/Panel.module.css';

type Props = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export const Toggle: React.FC<Props> = (props) => {
  const { open, setOpen } = props;

  const { map } = useMap(MAP_ID);

  useEffect(() => {
    if (!map) {
      return;
    }

    map.resize();
  }, [open]);

  return (
    <Button
      variant="default"
      className={`${styles.toggleButton} ${open ? '' : styles.toggleClosed}`}
      onClick={() => setOpen(!open)}
      p={0}
      radius={0}
    >
      <Arrow />
    </Button>
  );
};
