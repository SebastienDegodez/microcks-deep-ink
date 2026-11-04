import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Input, Textarea } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Input',
  component: Input,
  parameters: itemParams(['input'], 'Native `<input>` and `<textarea>`. The border uses `--border-control` (3:1 against every ground). Always pair with a visible label, see Field.'),
} satisfies Meta<typeof Input>;

export const Default: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-1">Search services</label>
      <Input id="in-1" placeholder="API Pastry" />
    </div>
  ),
};

/** `size="sm"` for dense toolbars; `surface="bg"` on a field that sits on a panel. */
export const Small: StoryObj = {
  render: () => (
    <div className="sb-col" style={{ maxWidth: 360 }}>
      <Input size="sm" aria-label="Filter, small" placeholder="Small input" />
      <Input surface="bg" aria-label="Filter, page background" placeholder="Background surface" />
      <Textarea size="sm" surface="bg" aria-label="Notes, small" placeholder="Small textarea" rows={3} />
    </div>
  ),
};

export const Mono: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-2">Operation path</label>
      <Input id="in-2" mono defaultValue="/pastries/{name}" />
    </div>
  ),
};

export const Invalid: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-3">Port</label>
      <Input id="in-3" aria-invalid="true" aria-describedby="in-3-e" defaultValue="80a" />
      <p className="error" id="in-3-e">
        <span className="sr-only">Error: </span>The port must be a number.
      </p>
    </div>
  ),
};

export const Multiline: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-4">Payload</label>
      <Textarea id="in-4" mono rows={4} defaultValue={'{\n  "name": "Millefeuille"\n}'} />
    </div>
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-5">Dispatcher</label>
      <Input id="in-5" disabled defaultValue="URI_PARTS" />
    </div>
  ),
};

export const OnPageBackground: StoryObj = {
  name: 'On the page background',
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-bg">Repository URL</label>
      <Input id="in-bg" mono surface="bg" defaultValue="https://gitlab.acme.io/bakery/pastry-api.git" />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Input> = {
  args: { 'aria-label': 'Search services', placeholder: 'Search services', size: 'md', mono: false, surface: undefined, type: 'text', disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    surface: { control: 'inline-radio', options: [undefined, 'surface', 'bg'] },
  },
};
