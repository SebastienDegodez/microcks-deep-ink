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
  ['A2A', 'Pastry concierge', '1.0'],
];

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
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
    <div className="inline">
      <ApiBadge label="conformance" value="92 %" status="success" />
      <ApiBadge label="last run" value="2 failures" status="danger" />
      <ApiBadge label="drift" value="1 field" status="warning" />
      <ApiBadge label="replayed" value="1,204 msgs" />
    </div>
  ),
};

export const PageHeader: StoryObj = {
  name: 'Page header sizes',
  render: () => (
    <div className="stack">
      <h1 style={{ margin: 0 }}>
        <ApiBadge size="xl" protocol="REST" name="API Pastry" version="2.0" />
      </h1>
      <ApiBadge size="lg" protocol="REST" name="API Pastry" version="2.0" />
    </div>
  ),
};

export const ProofValues: StoryObj = {
  name: 'Proof with several values',
  render: () => <ApiBadge label="samples" value="7" values={[{ value: '+1 AI', status: 'warning' }]} />,
};

export const Card: StoryObj = {
  name: 'Card (badge wall)',
  render: () => (
    <div className="stack" style={{ maxWidth: 260 }}>
      <ApiBadge size="card" protocol="REST" name="API Pastry" version="2.0" />
      <ApiBadge size="card" protocol="EVENT" name="Pastry orders API with a long name" version="0.1.0" />
      <ApiBadge label="conformance" value="untested" status="neutral" />
    </div>
  ),
};
