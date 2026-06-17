/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Box } from '@mantine/core';
import styles from '@/features/Tools/Compare/Compare.module.css';
import { Location } from '@/stores/main/types';
import { Tab } from './Tab';

type Props = {
  locations: Location[];
  panelOpen: boolean;
  from: string;
  to: string;
};

const Data: React.FC<Props> = (props) => {
  const { locations, panelOpen, from, to } = props;

  const test = useRef<string>(null);

  useEffect(() => {
    test.current = null;
  }, [test]);

  return (
    <Box
      className={`${styles.dataWrapper} ${panelOpen ? styles.dataWrapperPartial : styles.dataWrapperFull}`}
    >
      <Tab locations={locations} from={from} to={to} />
    </Box>
  );
};

export default Data;
