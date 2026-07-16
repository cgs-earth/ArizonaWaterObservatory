/**
 * Copyright 2026 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from 'react';
import { bbox, featureCollection } from '@turf/turf';
import { Group, ModalProps, Stack, Text } from '@mantine/core';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Variant } from '@/components/types';
import { getBBox } from '@/consts/bbox';
import { spatialService } from '@/services/init';
import useMainStore from '@/stores/main';
import { isSpatialSelectionPredefined } from '@/stores/main/slices/spatialSelection';
import { PredefinedBoundary } from '@/stores/main/types';

type Props = Pick<ModalProps, 'opened' | 'onClose'> & {
  onConfirm: (drawnShapesAreInvalid: boolean) => void;
};

export const Confirm: React.FC<Props> = (props) => {
  const { opened, onClose, onConfirm } = props;

  const drawnShapes = useMainStore((state) => state.drawnShapes);
  const spatialSelection = useMainStore((state) => state.spatialSelection);

  const drawnShapesAreInvalid = useMemo(() => {
    if (drawnShapes.length === 0) {
      return false;
    }

    if (
      spatialSelection &&
      isSpatialSelectionPredefined(spatialSelection) &&
      spatialSelection.boundary === PredefinedBoundary.ColoradoRiverBasin
    ) {
      const userBBox = bbox(featureCollection(drawnShapes));
      const azBBox = getBBox(PredefinedBoundary.Arizona);

      const { intersectsBoundary, smaller } = spatialService.validateBBox(userBBox, azBBox);

      return !intersectsBoundary || !smaller;
    }

    return false;
  }, [drawnShapes, spatialSelection]);

  // This modal needs to render above the popover (popover z index: 301)
  return (
    <Modal
      zIndex="var(--z-confirm-modal)"
      size="lg"
      title="Confirm"
      opened={opened}
      onClose={onClose}
      centered
    >
      <Stack p="var(--default-spacing)" gap="calc(var(--default-spacing) * 2)">
        <Text size="lg" mr="auto" fw={700}>
          Confirm
        </Text>
        <Text ml="var(--default-spacing)">
          This action will require re-fetching data for all layers. This may take some time.
        </Text>
        {drawnShapesAreInvalid && (
          <Text ml="var(--default-spacing)">
            There are drawn shapes outside of the new boundary. These will be removed.
          </Text>
        )}
        <Group gap="var(--default-spacing)">
          <Button
            size="xs"
            variant={Variant.Primary}
            onClick={() => onConfirm(drawnShapesAreInvalid)}
          >
            Ok
          </Button>
          <Button size="xs" variant={Variant.Tertiary} onClick={onClose}>
            Cancel
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
