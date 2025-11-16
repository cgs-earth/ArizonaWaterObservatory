/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Tabs, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import InfoSimple from '@/assets/InfoSimple';
import IconButton from '@/components/IconButton';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { About } from '@/features/TopBar/Info/About';
import { FAQ } from '@/features/TopBar/Info/FAQ';
import { Glossary } from '@/features/TopBar/Info/Glossary';
import styles from '@/features/TopBar/TopBar.module.css';
import useSessionStore from '@/stores/session';
import { HelpTab, Overlay } from '@/stores/session/types';

export const INFO_LOCAL_KEY = 'awo-show-info';

const Info: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => {
      setOverlay(null);
    },
  });

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);
  const helpTab = useSessionStore((store) => store.helpTab);
  const setHelpTab = useSessionStore((store) => store.setHelpTab);

  // local state to trigger render cycle
  const [showHelp, setShowHelp] = useState(false);
  // const onLoad = useRef(true)

  useEffect(() => {
    if (overlay !== Overlay.Info) {
      close();
    } else if (!opened) {
      open();
    }
  }, [overlay]);

  useEffect(() => {
    const showHelp = localStorage.getItem(INFO_LOCAL_KEY);
    if (!showHelp || showHelp === 'true') {
      open();
      setShowHelp(true);
    } else if (showHelp === 'false') {
      setShowHelp(false);
    }
  }, []);

  const handleClick = () => {
    setHelpTab(HelpTab.About);
    open();
  };

  return (
    <>
      <Tooltip label="Access the about page.">
        <IconButton
          variant={opened && helpTab === HelpTab.About ? Variant.Selected : Variant.Secondary}
          onClick={handleClick}
        >
          <InfoSimple />
        </IconButton>
      </Tooltip>
      <Modal size="xl" opened={opened} onClose={close} keepMounted>
        <Tabs
          value={helpTab}
          className={`${styles.modalBody} ${styles.tabs}`}
          onChange={(tab) => setHelpTab(tab as HelpTab)}
        >
          <Tabs.List grow className={styles.tabsList}>
            <Tabs.Tab value={HelpTab.About}>
              <Text size="lg" fw={700}>
                About
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value={HelpTab.Glossary}>
              <Text size="lg" fw={700}>
                Glossary
              </Text>
            </Tabs.Tab>
            <Tabs.Tab value={HelpTab.FAQ}>
              <Text size="lg" fw={700}>
                Frequently Asked Questions
              </Text>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={HelpTab.About}>
            <About showHelp={showHelp} />
          </Tabs.Panel>
          <Tabs.Panel value={HelpTab.Glossary}>
            <Glossary />
          </Tabs.Panel>
          <Tabs.Panel value={HelpTab.FAQ}>
            <FAQ />
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </>
  );
};

export default Info;
