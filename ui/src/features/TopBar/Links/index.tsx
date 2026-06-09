/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, Stack, Text, Title, Tooltip } from '@mantine/core';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { Layer } from '@/features/TopBar/Links/Layer';
import styles from '@/features/TopBar/Links/Links.module.css';
import { useAreDataToolsEnabled } from '@/hooks/useAreDataToolsEnabled';
import useMainStore from '@/stores/main';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

const Links: React.FC = () => {
  const layers = useMainStore((store) => store.layers);

  const overlay = useSessionStore((store) => store.overlay);
  const setOverlay = useSessionStore((store) => store.setOverlay);
  const setLinkLocation = useSessionStore((store) => store.setLinkLocation);

  const { areDataToolsEnabled } = useAreDataToolsEnabled();

  const opened = overlay === Overlay.Links;

  const handleOpen = () => {
    setOverlay(Overlay.Links);
  };

  const handleClose = () => {
    setLinkLocation(null);
    setOverlay(null);
  };

  const helpText = (
    <>
      <Text size="sm">Access the API links used to fetch data for each location.</Text>
      <br />
      <Text size="sm">At least one layer must have viable locations and parameters selected.</Text>
    </>
  );

  return (
    <>
      <Tooltip label={helpText}>
        <Button
          disabled={!areDataToolsEnabled}
          data-disabled={!areDataToolsEnabled}
          size="sm"
          variant={opened ? Variant.Selected : Variant.Secondary}
          onClick={handleOpen}
        >
          Export
        </Button>
      </Tooltip>
      <Modal size="1222px" opened={opened} onClose={handleClose}>
        <Box className={styles.modalHeader}>
          <Title order={5} size="h3" p="var(--default-spacing)">
            API Links
          </Title>
        </Box>
        <Stack gap={0} className={styles.modalBody}>
          <>
            {layers.map((layer) => (
              <Layer key={`links-entry-${layer.name}-${layer.id}`} layer={layer} />
            ))}
          </>
        </Stack>
      </Modal>
    </>
  );
};

export default Links;
