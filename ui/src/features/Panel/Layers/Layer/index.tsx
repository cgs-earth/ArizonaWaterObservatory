/**
 * Copyright 2025 Lincoln Institute of Land Policy
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ComboboxData, Divider, Group, Stack } from '@mantine/core';
import Button from '@/components/Button';
import ColorInput from '@/components/ColorInput';
import Select from '@/components/Select';
import TextInput from '@/components/TextInput';
import { Variant } from '@/components/types';
import useMainStore from '@/stores/main';
import { Layer as LayerType } from '@/stores/main/types';

type Props = {
  layer: LayerType;
};

const Layer: React.FC<Props> = (props) => {
  const { layer } = props;

  const originalCollections = useMainStore((state) => state.originalCollections);

  const [name, setName] = useState(layer.name);
  const [color, setColor] = useState(layer.color);
  const [parameters, setParameters] = useState(layer.parameters);

  const [data, setData] = useState<ComboboxData>();

  useEffect(() => {
    const collection = originalCollections.find(
      (collection) => collection.id === layer.datasourceId
    );
  }, [layer]);

  const handleSave = () => {};

  console.log('layer', layer);

  return (
    <Stack>
      <Group justify="space-between">
        <TextInput
          label="Layer Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <TextInput
          label="Layer Name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <ColorInput label="Symbol Color" value={color} onChange={(value) => setName(value)} />
      </Group>
      <Divider />
      <Select multiple clearable data={data} value={parameters} onChange={setParameters} />
      <Group>
        <Button size="xs" variant={Variant.Primary} onClick={() => handleSave()}>
          Save
        </Button>
        <Button size="xs" variant={Variant.Tertiary} onClick={() => handleSave()}>
          Cancel
        </Button>
      </Group>
    </Stack>
  );
};

export default Layer;
