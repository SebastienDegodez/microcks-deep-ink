import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { Callout } from '@microcks-deep-ink/registry/react/callout';
import { itemParams } from './_meta';

export default {
  title: 'Components/Callout',
  component: Callout,
  parameters: itemParams(['callout', 'button'], 'Tone is carried by an icon and a title as well as color. Use `live` only for a message that appears after an action; a static callout is not announced.'),
} satisfies Meta<typeof Callout>;

export const Default: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 640 }}>
      <Callout tone="info" title="Contract imported">3 operations and 9 examples were created.</Callout>
      <Callout tone="success" title="Test passed">All 12 operations conform.</Callout>
      <Callout tone="warning" title="Schema drift">The response has a field the contract does not declare.</Callout>
      <Callout tone="danger" title="Test failed">patchPastry returned price as a string.</Callout>
    </div>
  ),
};

/** `live="polite"` announces the callout when it appears. Use it for a message that follows an action. */
export const LivePolite: StoryObj = {
  name: 'Announced (polite and assertive)',
  render: () => (
    <div className="sb-col" style={{ maxWidth: 640 }}>
      <Callout tone="success" title="Saved" live="polite">The service settings were saved.</Callout>
      <Callout tone="danger" title="Import failed" live="assertive">The file is not a valid OpenAPI document.</Callout>
    </div>
  ),
};

export const AI: StoryObj = {
  name: 'AI generated',
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Callout tone="ai" actions={<Button size="sm">Review</Button>}>
        3 examples were suggested from the contract. Nothing is saved until you accept.
      </Callout>
    </div>
  ),
};

export const Live: StoryObj = {
  name: 'Announced',
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Callout tone="danger" live="assertive" title="Import failed">The file is not valid OpenAPI.</Callout>
    </div>
  ),
};

export const Outline: StoryObj = {
  name: 'Outline note',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      <Callout tone="ai" variant="outline" title="">Proposed by AI from the contract's <code>Pastry</code> schema. The mock only serves it once accepted.</Callout>
      <Callout tone="warning" variant="outline">The secondary artifact needs API Pastry 2.0 in Microcks first: install the main package, then come back.</Callout>
      <div style={{ maxWidth: 360 }}>
        <Callout tone="warning" variant="outline" size="sm">The token shown here is masked: paste the real secret in your CI settings.</Callout>
      </div>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Callout> = {
  args: { tone: 'info', title: 'Contract imported', children: '12 operations were found in the OpenAPI file.', variant: 'filled', size: 'md', live: false },
  argTypes: {
    tone: { control: 'select', options: ['info', 'success', 'warning', 'danger', 'ai'] },
    variant: { control: 'inline-radio', options: ['filled', 'outline'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    live: { control: 'inline-radio', options: [false, 'polite', 'assertive'] },
  },
};
