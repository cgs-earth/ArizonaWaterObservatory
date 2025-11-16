/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { Group, Loader, Stack, Text, Title, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import Info from '@/assets/Info';
import Button from '@/components/Button';
import CopyInput from '@/components/CopyInput';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import styles from '@/features/TopBar/TopBar.module.css';
import { useLoading } from '@/hooks/useLoading';
import loadingManager from '@/managers/Loading.init';
import mainManager from '@/managers/Main.init';
import { SHARE_VARIABLE } from '@/managers/types';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { LoadingType, Overlay } from '@/stores/session/types';

const Share: React.FC = () => {
  const [opened, { open, close }] = useDisclosure(false, {
    onClose: () => setOverlay(null),
  });

  const { isGeneratingShare } = useLoading();

  const shareId = useMainStore((store) => store.shareId);
  const setShareId = useMainStore((store) => store.setShareId);
  const configGenerated = useMainStore((store) => store.configGenerated);
  const setConfigGenerated = useMainStore((store) => store.setConfigGenerated);

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);

  const controller = useRef<AbortController>(null);
  const isMounted = useRef(true);

  const handleGenerate = async () => {
    const loadingInstance = loadingManager.add('Generating share config', LoadingType.Share);
    try {
      controller.current = new AbortController();
      const { success, response } = await mainManager.saveConfig(controller.current.signal);
      loadingManager.remove(loadingInstance);

      if (success) {
        const [shareId] = response;

        if (isMounted.current) {
          setShareId(shareId);
          setConfigGenerated(true);
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        console.error(error);
      }
    } finally {
      loadingManager.remove(loadingInstance);
    }
  };

  const handleClose = () => {
    if (controller.current) {
      controller.current.abort('Cancel request');
    }
    close();
  };

  const getShareUrl = (shareId: string): string => {
    const url = new URL(window.location.href);
    url.searchParams.set(SHARE_VARIABLE, shareId);

    return url.toString();
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (controller.current) {
        controller.current.abort('Component unmount');
      }
    };
  }, []);

  useEffect(() => {
    if (overlay !== Overlay.Share) {
      close();
    }
  }, [overlay]);

  const helpText = (
    <>
      <Text size="sm">Generate a shareable URL.</Text>
      <br />
      <Text size="sm">
        Users accessing the AWO using the generated URL will see a screen matching all current
        configuration choices (ie generated layers, drawn shapes etc).
      </Text>
    </>
  );

  return (
    <>
      <Tooltip className={styles.toolTip} multiline label={helpText}>
        <Button
          size="sm"
          w="fit-content"
          variant={opened ? Variant.Selected : Variant.Secondary}
          onClick={open}
        >
          Share
        </Button>
      </Tooltip>
      <Modal opened={opened} onClose={handleClose}>
        <Stack className={styles.modalBody} align="center">
          <Tooltip className={styles.toolTip} multiline label={helpText}>
            <Group className={styles.helpTitle} gap="xs">
              <Title order={5} size="h3">
                Share
              </Title>
              <Info />
            </Group>
          </Tooltip>
          {(isGeneratingShare || shareId.length > 0) && (
            <Group justify="center" align="center" className={styles.copyInputWrapper}>
              {isGeneratingShare ? (
                <Loader />
              ) : (
                <>
                  {shareId.length > 0 && (
                    <Stack className={styles.copyInputWrapper} gap="0">
                      <CopyInput className={styles.copyInput} url={getShareUrl(shareId)} />
                      {!configGenerated && (
                        <Text size="sm" c="red" mt="calc(var(--default-spacing) / 2)">
                          This URL does not contain recent changes made in the application. Please
                          generate a new URL to reflect the latest choices.
                        </Text>
                      )}
                    </Stack>
                  )}
                </>
              )}
            </Group>
          )}
          <Group mr="auto">
            <Tooltip disabled={!configGenerated} label="No changes made to application config.">
              <Button
                size="sm"
                data-disabled={isGeneratingShare || configGenerated}
                disabled={isGeneratingShare || configGenerated}
                variant={Variant.Primary}
                onClick={handleGenerate}
              >
                Generate
              </Button>
            </Tooltip>
            <Button size="sm" variant={Variant.Tertiary} onClick={handleClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default Share;
