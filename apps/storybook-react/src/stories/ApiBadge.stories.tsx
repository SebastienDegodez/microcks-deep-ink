import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MkApiBadge, MkMethodTag } from '@microcks-deep-ink/react';

const meta: Meta<typeof MkApiBadge> = {
  title: 'Signature/ApiBadge',
  component: MkApiBadge,
  parameters: {
    docs: {
      description: {
        component:
          'Two-segment shield. **Left = what** (protocol, metric label or ARAZZO), **right = who or proof** (name + version, or a status fill). The label carries the meaning; the color only speeds up scanning.',
      },
    },
  },
  argTypes: {
    protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT'] },
    status: { control: 'select', options: ['success', 'danger', 'warning', 'info', 'neutral'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
  args: { protocol: 'REST', name: 'API Pastry', version: '2.0' },
};
export default meta;
type S = StoryObj<typeof MkApiBadge>;

export const Service: S = {};

export const Proof: S = { args: { label: 'conformance', value: '92%', status: 'success', protocol: undefined, name: undefined, version: undefined } };

export const Workflow: S = { args: { arazzo: true, name: 'Restock a pastry', version: '1.2.0', protocol: undefined } };

export const AllProtocols: S = {
  render: () => (
    <div className="di-stack">
      <MkApiBadge protocol="REST" name="API Pastry" version="2.0" />
      <MkApiBadge protocol="SOAP" name="HelloService" version="0.9" />
      <MkApiBadge protocol="EVENT" name="Pastry orders" version="0.1.0" />
      <MkApiBadge protocol="gRPC" name="HelloService" version="v1" />
      <MkApiBadge protocol="GRAPHQL" name="Movie Graph" version="1.0" />
      <MkApiBadge protocol="DIRECT" name="Rocks" version="0.1" />
      <MkApiBadge arazzo name="Restock a pastry" version="1.2.0" />
    </div>
  ),
};

export const StandardProofs: S = {
  render: () => (
    <div className="di-stack">
      <MkApiBadge label="conformance" value="92%" status="success" />
      <MkApiBadge label="last test" value="✕ failed" status="danger" />
      <MkApiBadge label="mcp" value="agent-ready" status="info" />
      <MkApiBadge label="samples" value="3 + 2 AI" status="warning" />
    </div>
  ),
};

export const MethodTags: StoryObj<typeof MkMethodTag> = {
  render: () => (
    <div className="di-stack">
      <MkMethodTag method="GET" protocol="REST" />
      <MkMethodTag method="PATCH" protocol="REST" />
      <MkMethodTag method="SUBSCRIBE" protocol="EVENT" />
      <MkMethodTag method="SayHello" protocol="gRPC" />
      <MkMethodTag method="QUERY" protocol="GRAPHQL" />
      <MkMethodTag method="POST" protocol="SOAP" />
    </div>
  ),
};
