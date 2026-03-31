/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ActionIcon, Box, Group, Popover, Stack, Text, Title, Tooltip } from '@mantine/core';
import Info from '@/assets/Info';
import SearchIcon from '@/assets/Search';
import { Entry } from '@/features/Panel/Layers/Layer/Search/Entry';
import styles from '@/features/Panel/Layers/Layer/Search/Search.module.css';
import mainManager from '@/managers/Main.init';
import useMainStore from '@/stores/main';
import { Layer } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';
import { CollectionType, getCollectionType } from '@/utils/collection';

type Props = {
  layerId?: Layer['id'];
};

const Search: React.FC<Props> = (props) => {
  const { layerId } = props;

  const layers = useMainStore((state) => state.layers)
    .filter((layer) => !layerId || layer.id === layerId)
    .filter(
      (layer) =>
        layer.loaded &&
        [CollectionType.EDR, CollectionType.Features].includes(
          getCollectionType(mainManager.getDatasource(layer.datasourceId)!)
        )
    );

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [show, setShow] = useState(false);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Search : null);
    setShow(show);
  };

  useEffect(() => {
    if (overlay !== Overlay.Search) {
      setShow(false);
    }
  }, [overlay]);

  const helpText = (
    <>
      <Text size="sm">
        Search across the feature properties and values for each the data sources listed below.
      </Text>
    </>
  );

  if (layers.length === 0) {
    return null;
  }

  return (
    <Popover opened={show} onChange={setShow} position="right-start" closeOnClickOutside={false}>
      <Popover.Target>
        <Tooltip label="Search across features shown for this data source" disabled={show}>
          <ActionIcon className={styles.searchButton} size="lg" onClick={() => handleShow(!show)}>
            <SearchIcon />
          </ActionIcon>
        </Tooltip>
      </Popover.Target>
      <Popover.Dropdown>
        <Box className={styles.wrapper}>
          <Tooltip multiline label={helpText}>
            <Group className={styles.title} gap="xs" mb="var(--default-spacing)">
              <Title order={4} size="h5">
                Search
              </Title>
              <Info />
            </Group>
          </Tooltip>

          <Stack
            gap={0}
            className={`${styles.container} ${styles.dateSelectorContainer}`}
            align="flex-start"
          >
            {layers.map((layer) => (
              <Entry key={`layer-order-${layer.id}`} layer={layer} />
            ))}
          </Stack>
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
};

export default Search;
