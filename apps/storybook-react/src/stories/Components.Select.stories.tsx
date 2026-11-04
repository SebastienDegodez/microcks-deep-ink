import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Select } from '@microcks-deep-ink/registry/react/select';
import { itemParams } from './_meta';

export default {
  title: 'Components/Select',
  component: Select,
  parameters: itemParams(['select'], 'The native `<select>`: the browser keeps keyboard, typeahead and the mobile picker.'),
} satisfies Meta<typeof Select>;

export const Default: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 320 }}>
      <label className="label" htmlFor="sel-1">Dispatcher</label>
      <Select id="sel-1" defaultValue="URI_PARTS">
        <option value="URI_PARTS">URI_PARTS</option>
        <option value="URI_PARAMS">URI_PARAMS</option>
        <option value="JSON_BODY">JSON_BODY</option>
        <option value="SCRIPT">SCRIPT</option>
      </Select>
    </div>
  ),
};

export const Small: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 320 }}>
      <label className="label" htmlFor="sel-2">Rows per page</label>
      <Select id="sel-2" size="sm" defaultValue="25">
        <option>10</option>
        <option>25</option>
        <option>50</option>
      </Select>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Select> = {
  args: {
    'aria-label': 'Protocol', size: 'md', disabled: false,
    children: <><option>REST</option><option>EVENT</option><option>gRPC</option></>,
  },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'sm'] } },
};
