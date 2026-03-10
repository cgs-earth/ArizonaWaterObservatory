/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: MIT
 */

import { Fragment } from 'react';
import { Box, Divider } from '@mantine/core';
import { Entry } from '@/features/Tools/Legend/Entry';
import mainManager from '@/managers/Main.init';
import { Layer, MainState } from '@/stores/main/types';

type Props = {
  layers: MainState['layers'];
  showControls?: boolean;
  className?: string;
  direction?: 'row' | 'column';
};

export const Content: React.FC<Props> = (props) => {
  const { layers, showControls = true, className, direction = 'row' } = props;

  const handleColorChange = (color: Layer['color'], layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        color,
        layer.parameters,
        layer.from,
        layer.to,
        layer.visible,
        layer.opacity,
        layer.paletteDefinition
      );
    }
  };

  const handleVisibilityChange = (visible: boolean, layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        layer.color,
        layer.parameters,
        layer.from,
        layer.to,
        visible,
        layer.opacity,
        layer.paletteDefinition
      );
    }
  };

  const handleOpacityChange = (opacity: number, layerId: Layer['id']) => {
    const layer = mainManager.getLayer(layerId);

    if (layer) {
      void mainManager.updateLayer(
        layer,
        layer.name,
        layer.color,
        layer.parameters,
        layer.from,
        layer.to,
        layer.visible,
        opacity,
        layer.paletteDefinition
      );
    }
  };

  return (
    <Box className={className}>
      {layers.map((layer, index) => (
        <Fragment key={`legend-entry-${layer.id}`}>
          <Entry
            layer={layer}
            handleColorChange={handleColorChange}
            handleVisibilityChange={handleVisibilityChange}
            handleOpacityChange={handleOpacityChange}
            showControls={showControls}
            direction={direction}
          />
          {index < layers.length - 1 && <Divider />}
        </Fragment>
      ))}
    </Box>
  );
};
