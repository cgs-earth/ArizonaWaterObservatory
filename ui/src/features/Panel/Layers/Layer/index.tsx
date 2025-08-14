/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layer as LayerType } from '@/stores/main/types';

type Props = {
  layer: LayerType;
};

const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  console.log('layer', layer);

  return <></>;
};

export default Layer;
