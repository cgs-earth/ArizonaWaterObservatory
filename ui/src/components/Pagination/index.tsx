/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent, MouseEventHandler } from 'react';
import { Pagination as _Pagination, PaginationProps } from '@mantine/core';
import styles from '@/components/Pagination/Pagination.module.css';
import { Variant } from '@/components/types';

type Props = PaginationProps & {
  variant?: Variant;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const Pagination: React.FC<Props> = (props) => {
  const { variant = Variant.Primary, onClick, ...paginationProps } = props;

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  const variantClass = styles[variant];

  return (
    <_Pagination
      classNames={{ root: styles.root, control: `${styles.control} ${variantClass}` }}
      variant="filled"
      size="md"
      radius="xl"
      onClick={handleClick}
      {...paginationProps}
    />
  );
};

export default Pagination;
