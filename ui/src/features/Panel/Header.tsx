/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Image, Stack, Title } from '@mantine/core';
import styles from '@/features/Panel/Panel.module.css';

export const Header: React.FC = () => {
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
        h={100}
        style={{
          height: 'auto',
          width: 'auto',
        }}
        fit="contain"
      />
      <Title order={1} size="h2" className={styles.title}>
        Arizona Water Observatory
      </Title>
    </Stack>
  );
};
