/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fragment, useEffect, useState } from 'react';
import { Divider, Stack, Title, Tooltip } from '@mantine/core';
import Calendar from '@/assets/Calendar';
import Button from '@/components/Button';
import IconButton from '@/components/IconButton';
import Popover from '@/components/Popover';
import { Variant } from '@/components/types';
import { Entry } from '@/features/Tools/DateSelector/Entry';
import styles from '@/features/Tools/Tools.module.css';
import { Layer } from '@/stores/main/types';
import useSessionStore from '@/stores/session';
import { Overlay } from '@/stores/session/types';

type Props = {
  layers: Layer[];
};

const DateSelector: React.FC<Props> = (props) => {
  const { layers } = props;

  const overlay = useSessionStore((state) => state.overlay);
  const setOverlay = useSessionStore((state) => state.setOverlay);

  const [show, setShow] = useState(false);

  const handleShow = (show: boolean) => {
    setOverlay(show ? Overlay.Date : null);
    setShow(show);
  };

  useEffect(() => {
    if (overlay !== Overlay.Date) {
      setShow(false);
    }
  }, [overlay]);

  return (
    <Popover
      opened={show}
      onChange={setShow}
      position="bottom-start"
      closeOnClickOutside={false}
      target={
        <Tooltip label="Change visualized dates." disabled={show}>
          <IconButton
            size="xl"
            variant={show ? Variant.Selected : Variant.Secondary}
            onClick={() => handleShow(!show)}
            className={styles.dateSelectorButton}
          >
            <Calendar />
          </IconButton>
        </Tooltip>
      }
      content={
        <Stack
          gap="var(--default-spacing)"
          className={`${styles.container} ${styles.dateSelectorContainer}`}
          align="flex-start"
        >
          <Title order={5} size="h3">
            Visualized Dates
          </Title>
          {layers.map((layer) => (
            <Fragment key={`date-selector-${layer}`}>
              <Entry layer={layer} />
              <Divider />
            </Fragment>
          ))}
          <Button size="sm" variant={Variant.Primary} onClick={() => handleShow(false)}>
            Ok
          </Button>
        </Stack>
      }
    />
  );
};

export default DateSelector;
