import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Input, Textarea } from '@microcks-deep-ink/registry/react/input';
import { itemParams } from './_meta';

export default {
  title: 'Components/Input',
  parameters: itemParams(['input'], 'Native `<input>` and `<textarea>`. The border uses `--border-control` (3:1 against every ground). Always pair with a visible label, see Field.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="label" htmlFor="in-1">Search services</label>
      <Input id="in-1" placeholder="API Pastry" />
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
