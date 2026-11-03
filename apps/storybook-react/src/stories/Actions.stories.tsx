import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { fn } from 'storybook/test';
import { MkButton, MkChip, MkInput, MkTabs } from '@microcks-deep-ink/react';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';

const meta: Meta<typeof MkButton> = {
  title: 'Actions/Button',
  component: MkButton,
  args: { variant: 'primary', size: 'md', disabled: false, children: 'Run test', onMkClick: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    icon: { control: 'select', options: [undefined, 'upload', 'tests', 'copy', 'spark'] },
  },
  parameters: {
    docs: { description: { component: 'Sturdy, near-square actions. One primary per task region. 44px for primary actions, 32px in dense toolbars. Never pill-shaped.' } },
  },
};
export default meta;
type S = StoryObj<typeof MkButton>;

export const Playground: S = {};

export const Variants: S = {
  render: () => (
    <div className="di-stack">
      <MkButton variant="primary">Run test</MkButton>
      <MkButton variant="secondary" icon="upload">Import</MkButton>
      <MkButton variant="ghost" icon="copy">Copy mock URL</MkButton>
      <MkButton variant="danger">Delete</MkButton>
      <MkButton variant="danger" confirm>Delete service</MkButton>
      <MkButton variant="primary" disabled>Disabled</MkButton>
    </div>
  ),
};

export const DenseToolbar: S = {
  render: () => (
    <div className="di-stack">
      <MkButton size="sm" variant="primary">Run test</MkButton>
      <MkButton size="sm">Edit</MkButton>
      <MkButton size="sm" variant="ghost">Copy</MkButton>
    </div>
  ),
};

export const Input: StoryObj<typeof MkInput> = {
  render: () => {
    const [v, setV] = useState('https://raw.githubusercontent.com/microcks/microcks/master/samples/APIPastry-openapi.yaml');
    return (
      <div className="di-col" style={{ maxWidth: 560 }}>
        <MkInput label="Contract URL" mono value={v} onMkInput={(e) => setV(e.detail)} helpText="OpenAPI, AsyncAPI, gRPC, GraphQL, Postman, SoapUI." />
        <MkInput label="Secret" placeholder="Select a secret" />
        <MkInput label="Service name" value="API Pastry" error="A service with this name and version already exists." />
      </div>
    );
  },
};

export const Tabs: StoryObj<typeof MkTabs> = {
  render: () => {
    const [v, setV] = useState('operations');
    return (
      <div className="di-col">
        <MkTabs tabs={SERVICE_TABS} value={v} onMkChange={(e) => setV(e.detail)} />
        <span className="di-note">Active: {v}</span>
      </div>
    );
  },
};

export const Chips: StoryObj<typeof MkChip> = {
  render: () => (
    <div className="di-stack">
      <MkChip labelKey="domain">pastry</MkChip>
      <MkChip labelKey="status">GA</MkChip>
      <MkChip>team-bakery</MkChip>
    </div>
  ),
};
