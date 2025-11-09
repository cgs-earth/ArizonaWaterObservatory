/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { MouseEvent, MouseEventHandler } from 'react';
import { ActionIcon, ActionIconProps, PolymorphicComponentProps } from '@mantine/core';
import styles from '@/components/IconButton/IconButton.module.css';
import { ExtendedVariant } from '@/components/IconButton/IconButton.types';
import { Variant } from '@/components/types';

type Props = PolymorphicComponentProps<'button', ActionIconProps> & {
  variant?: Variant | ExtendedVariant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
};

const IconButton: React.FC<Props> = (props) => {
  const { onClick, variant = Variant.Primary, ...actionIconProps } = props;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (onClick) {
      onClick(event);
    }
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
