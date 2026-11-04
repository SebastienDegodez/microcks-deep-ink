import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { Callout } from '@microcks-deep-ink/registry/react/callout';
import { itemParams } from './_meta';

export default {
  title: 'Components/Callout',
  parameters: itemParams(['callout', 'button'], 'Tone is carried by an icon and a title as well as color. Use `live` only for a message that appears after an action; a static callout is not announced.'),
} satisfies Meta;

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
      <Callout tone="warning" variant="outline">The secondary artifact needs API Pastry 2.0 in Microcks first: install the main package, then come back.</Callout>
      <div style={{ maxWidth: 360 }}>
        <Callout tone="warning" variant="outline" size="sm">The token shown here is masked: paste the real secret in your CI settings.</Callout>
      </div>
    </div>
  ),
};
