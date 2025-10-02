/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent, MouseEventHandler } from 'react';
import { Button as _Button, ButtonProps } from '@mantine/core';
import styles from '@/components/Button/Button.module.css';
import { Variant } from '@/components/types';

type Props = ButtonProps & {
  variant?: Variant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const Button: React.FC<Props> = (props) => {
  const { variant = Variant.Primary, onClick, ...buttonProps } = props;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  const variantClass = styles[variant];

  return (
    <_Button
      classNames={{ root: `${styles.root} ${variantClass}`, inner: styles.inner }}
      variant="filled"
      size="md"
      radius="xl"
      onClick={handleClick}
      {...buttonProps}
    />
  );
};

export default Button;
