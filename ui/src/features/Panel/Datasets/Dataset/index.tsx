/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { ICollection } from '@/services/edr.service';

type Props = {
  dataset: ICollection;
};

const Dataset: React.FC<Props> = (props) => {
  const { dataset } = props;

  console.log('dataset', dataset);

  return <></>;
};

export default Dataset;
