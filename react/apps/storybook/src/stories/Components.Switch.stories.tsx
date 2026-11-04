import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Switch } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Switch',
  component: Switch,
  parameters: itemParams(['switch'], 'A native checkbox with `role="switch"`. The state is the checked state: the track also shows a mark, so it is not color only.'),
} satisfies Meta<typeof Switch>;

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

export const Large: StoryObj = {
  render: () => {
    const [on, setOn] = useState(true);
    return <Switch label="Stateful" size="lg" checked={on} onChange={setOn} />;
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Switch> = {
  args: { label: 'Send a Slack message', description: 'When a test fails.', checked: false, size: 'md', disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'lg'] }, onChange: { table: { disable: true } } },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return <Switch {...args} checked={checked} onChange={setChecked} />;
  },
};
