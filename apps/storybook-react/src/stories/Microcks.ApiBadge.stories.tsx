import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { ApiBadge, type Protocol } from '@microcks-deep-ink/registry/react/api-badge';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/ApiBadge',
  parameters: itemParams(['api-badge', 'icon'], 'Three segments: type, name, version. The visible text is the accessible name ("REST API Pastry 2.0"). The Arazzo variant inverts the left segment and never uses a protocol color.'),
} satisfies Meta;

const PROTOCOLS: Array<[Protocol, string, string]> = [
  ['REST', 'API Pastry', '2.0'],
  ['SOAP', 'HelloService', '0.9'],
  ['EVENT', 'Pastry orders API', '0.1.0'],
  ['gRPC', 'HelloService', 'v1'],
  ['GRAPHQL', 'Movie Graph', '1.0'],
  ['DIRECT', 'Direct', '1.0'],
];

export const Default: StoryObj = {
  render: () => (
    <div className="di-inline">
      {PROTOCOLS.map(([p, n, v]) => <ApiBadge key={p} protocol={p} name={n} version={v} />)}
    </div>
  ),
};

export const Small: StoryObj = {
  render: () => <ApiBadge size="sm" protocol="REST" name="API Pastry" version="2.0" />,
};

export const Workflow: StoryObj = {
  name: 'Arazzo workflow',
  render: () => <ApiBadge arazzo name="restock-pastry" />,
};

export const Proof: StoryObj = {
  render: () => (
    <div className="di-inline">
      <ApiBadge label="conformance" value="92 %" status="success" />
      <ApiBadge label="last run" value="2 failures" status="danger" />
      <ApiBadge label="drift" value="1 field" status="warning" />
      <ApiBadge label="replayed" value="1,204 msgs" />
    </div>
  ),
};
