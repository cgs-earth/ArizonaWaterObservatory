/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, CopyButton, Group, Text, Tooltip, UnstyledButton } from '@mantine/core';
import Check from '@/assets/Check';
import Copy from '@/assets/Copy';
import styles from '@/components/CopyInput/CopyInput.module.css';

type Props = {
  url: string;
};

const CopyInput: React.FC<Props> = (props) => {
  const { url } = props;
  return (
    <Box component="div" className={styles.input}>
      <Group justify="center" align="center" p={0} h="100%">
        <Text className={styles.text} title={url}>
          {url}
        </Text>
        <Box component="div" className={styles.buttonWrapper}>
          <CopyButton value={url}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                <UnstyledButton onClick={copy} className={styles.button}>
                  {copied ? <Check /> : <Copy />}
                </UnstyledButton>
              </Tooltip>
            )}
          </CopyButton>
        </Box>
      </Group>
    </Box>
  );
};

export default CopyInput;
