/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import Select from '@/components/Select';

export default {
  title: 'Select',
};

const data = ['ASU', 'AWO', 'CGS'];

export const Usage = () => (
  <Select
    label="Input label"
    description="Input description"
    placeholder="Pick an Acronym"
    data={data}
  />
);
