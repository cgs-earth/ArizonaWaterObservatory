/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { Warning } from './Warning';

export const Warnings: React.FC = () => {
  const warnings = useSessionStore((state) => state.warnings);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  useEffect(() => {
    if (warnings.length > 0) {
      setOverlay(Overlay.Warning);
    }
  }, [warnings]);

  return (
    <>
      {warnings.map(({ id, content }) => (
        <Warning key={`warning-popup-${id}`} id={id} content={content} />
      ))}
    </>
  );
};
