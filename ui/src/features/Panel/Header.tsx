/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Image, Stack, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import styles from '@/features/Panel/Panel.module.css';

export const Header: React.FC = () => {
  const mobile = useMediaQuery('(max-width: 899px)');

  return (
    <Stack
      gap={0}
      id="header-wrapper"
      justify="center"
      align="center"
      className={styles.headerWrapper}
    >
      {/* TODO: modularize */}
      <Image
        src="/ASU-logo.png"
        alt="Arizona State University Logo"
        h={mobile ? 80 : 100}
        style={{
          height: 'auto',
          width: 'auto',
        }}
        fit="contain"
      />
      <Title order={1} size={mobile ? 'h3' : 'h2'} className={styles.title}>
        Arizona Water Observatory
      </Title>
    </Stack>
  );
};
