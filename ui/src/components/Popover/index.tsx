/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode } from 'react';
import { Popover as _Popover, PopoverDropdown, PopoverProps, PopoverTarget } from '@mantine/core';

type Props = PopoverProps & {
  target: ReactNode;
  content: ReactNode;
  unmountOnExit?: boolean;
};

const Popover: React.FC<Props> = (props) => {
  const { target, content, unmountOnExit = false, ...popoverProps } = props;

  const shouldRender = popoverProps.opened || !unmountOnExit;

  return (
    <_Popover withArrow={false} {...popoverProps}>
      <PopoverTarget>{target}</PopoverTarget>
      {shouldRender && <PopoverDropdown>{content}</PopoverDropdown>}
    </_Popover>
  );
};

export default Popover;
