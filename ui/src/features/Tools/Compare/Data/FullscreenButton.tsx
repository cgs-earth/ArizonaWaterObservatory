/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Fullscreen from '@/assets/Fullscreen';
import FullscreenExit from '@/assets/FullscreenExit';
import IconButton from '@/components/IconButton';
import styles from '@/features/Tools/Compare/Compare.module.css';

/**
 *
 * @component
 */
type Props = {
  element: HTMLElement;
};

export const FullscreenButton: React.FC<Props> = (props) => {
  const { element } = props;

  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!document.fullscreenElement) {
      element.requestFullscreen();
      setOpen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setOpen(false);
    }
  };

  return (
    <IconButton
      title={!open ? 'Open Fullscreen' : 'Exit Fullscreen'}
      mb="0.5rem"
      onClick={handleClick}
      className={styles.fullscreenButton}
    >
      {!open ? <Fullscreen /> : <FullscreenExit />}
    </IconButton>
  );
};
