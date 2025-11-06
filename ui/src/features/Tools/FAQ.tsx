/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tooltip } from '@mantine/core';
import FAQIcon from '@/assets/FAQ';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import useSessionStore from '@/stores/session';
import { HelpTab, Overlay } from '@/stores/session/types';

export const FAQ: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);
  const helpTab = useSessionStore((state) => state.helpTab);
  const setHelpTab = useSessionStore((state) => state.setHelpTab);

  const handleClick = () => {
    setHelpTab(HelpTab.FAQ);
    setOverlay(Overlay.Info);
  };

  return (
    <Tooltip
      label="Access the frequently asked questions (FAQ)."
      disabled={overlay === Overlay.Info}
    >
      <IconButton
        variant={
          overlay === Overlay.Info && helpTab === HelpTab.FAQ ? Variant.Selected : Variant.Secondary
        }
        onClick={handleClick}
      >
        <FAQIcon />
      </IconButton>
    </Tooltip>
  );
};
