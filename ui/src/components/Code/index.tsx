/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Box, CopyButton, Group, Tooltip, UnstyledButton } from '@mantine/core';
import Check from '@/assets/Check';
import CopyCode from '@/assets/CopyCode';
import styles from '@/components/Code/Code.module.css';

type Props = {
  code: string;
};

const CopyInput: React.FC<Props> = (props) => {
  const { code } = props;
  return (
    <Box component="div" className={styles.input}>
      <Group justify="center" align="center" p={0} h="100%">
        <Box component="pre" className={styles.code} data-testid="code-block">
          {code}
        </Box>
        <Box component="div" className={styles.buttonWrapper}>
          <CopyButton value={code}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                <UnstyledButton onClick={copy} className={styles.button}>
                  {copied ? <Check /> : <CopyCode />}
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
