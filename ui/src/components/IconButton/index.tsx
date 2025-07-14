/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent } from 'react';
import { ActionIcon, ActionIconProps } from '@mantine/core';
import styles from '@/components/IconButton/IconButton.module.css';
import { Variant } from '@/components/types';

type Props = ActionIconProps & {
  variant?: Variant;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

const IconButton: React.FC<Props> = (props) => {
  const { onClick = () => null, variant = Variant.Primary, ...actionIconProps } = props;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick(event);
  };

  const variantClass = styles[variant];

  return (
    <ActionIcon
      classNames={{ root: `${styles.root} ${variantClass}`, icon: styles.icon }}
      variant="filled"
      size="lg"
      radius="xl"
      onClick={handleClick}
      {...actionIconProps}
    />
  );
};

export default IconButton;
