import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Switch } from '@microcks-deep-ink/registry/react/switch';
import { itemParams } from './_meta';

export default {
  title: 'Components/Switch',
  parameters: itemParams(['switch'], 'A native checkbox with `role="switch"`. The state is the checked state: the track also shows a mark, so it is not color only.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [on, setOn] = useState(true);
    return <Switch label="Schema validation" checked={on} onChange={setOn} />;
  },
};

export const WithDescription: StoryObj = {
  render: () => {
    const [on, setOn] = useState(false);
    return <Switch label="Record traffic" description="Keeps the last 1,000 calls for replay." checked={on} onChange={setOn} />;
  },
};

export const Disabled: StoryObj = {
  render: () => <Switch label="Managed by your administrator" checked onChange={() => undefined} disabled />,
};
