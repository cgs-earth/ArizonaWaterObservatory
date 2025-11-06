/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tooltip } from '@mantine/core';
import GlossaryIcon from '@/assets/Glossary';
import IconButton from '@/components/IconButton';
import { Variant } from '@/components/types';
import useSessionStore from '@/stores/session';
import { HelpTab, Overlay } from '@/stores/session/types';

export const Glossary: React.FC = () => {
  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);
  const helpTab = useSessionStore((state) => state.helpTab);
  const setHelpTab = useSessionStore((state) => state.setHelpTab);

  const handleClick = () => {
    setHelpTab(HelpTab.Glossary);
    setOverlay(Overlay.Info);
  };

  return (
    <Tooltip label="Access the glossary." disabled={overlay === Overlay.Info}>
      <IconButton
        variant={
          overlay === Overlay.Info && helpTab === HelpTab.Glossary
            ? Variant.Selected
            : Variant.Secondary
        }
        onClick={handleClick}
      >
        <GlossaryIcon />
      </IconButton>
    </Tooltip>
  );
};
