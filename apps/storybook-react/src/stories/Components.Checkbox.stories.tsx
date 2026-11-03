import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Checkbox } from '@microcks-deep-ink/registry/react/checkbox';
import { itemParams } from './_meta';

export default {
  title: 'Components/Checkbox',
  parameters: itemParams(['checkbox'], 'A native checkbox inside its label. The description is linked with `aria-describedby`.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [on, setOn] = useState(true);
    return <Checkbox label="Validate responses against the schema" checked={on} onChange={(e) => setOn(e.target.checked)} />;
  },
};

export const WithDescription: StoryObj = {
  render: () => (
    <Checkbox label="Run on every import" description="Triggers a conformance test whenever the contract changes." defaultChecked />
  ),
};

export const Disabled: StoryObj = {
  render: () => (
    <div className="di-stack">
      <Checkbox label="Disabled, unchecked" disabled />
      <Checkbox label="Disabled, checked" disabled defaultChecked />
    </div>
  ),
};
