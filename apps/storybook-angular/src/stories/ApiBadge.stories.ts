import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { DEEP_INK, MkApiBadge } from '@microcks-deep-ink/angular';

const meta: Meta<MkApiBadge> = {
  title: 'Signature/ApiBadge',
  component: MkApiBadge,
  decorators: [moduleMetadata({ imports: [DEEP_INK] })],
  parameters: {
    docs: {
      description: {
        component:
          'Two-segment shield. **Left = what** (protocol, metric label or ARAZZO), **right = who or proof** (name + version, or a status fill).',
      },
    },
  },
  argTypes: {
    protocol: { control: 'select', options: ['REST', 'SOAP', 'EVENT', 'gRPC', 'GRAPHQL', 'DIRECT'] },
    status: { control: 'select', options: ['success', 'danger', 'warning', 'info', 'neutral'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
  },
  args: { protocol: 'REST', name: 'API Pastry', version: '2.0' },
  render: (args) => ({
    props: args,
    template: `<mk-api-badge [protocol]="protocol" [label]="label" [arazzo]="arazzo" [name]="name" [version]="version" [value]="value" [status]="status" [size]="size"></mk-api-badge>`,
  }),
};
export default meta;
type S = StoryObj<MkApiBadge>;

export const Service: S = {};

export const Proof: S = { args: { label: 'conformance', value: '92%', status: 'success', protocol: undefined, name: undefined, version: undefined } };

export const Workflow: S = { args: { arazzo: true, name: 'Restock a pastry', version: '1.2.0', protocol: undefined } };

export const AllProtocols: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-api-badge protocol="REST" name="API Pastry" version="2.0"></mk-api-badge>
        <mk-api-badge protocol="SOAP" name="HelloService" version="0.9"></mk-api-badge>
        <mk-api-badge protocol="EVENT" name="Pastry orders" version="0.1.0"></mk-api-badge>
        <mk-api-badge protocol="gRPC" name="HelloService" version="v1"></mk-api-badge>
        <mk-api-badge protocol="GRAPHQL" name="Movie Graph" version="1.0"></mk-api-badge>
        <mk-api-badge protocol="DIRECT" name="Rocks" version="0.1"></mk-api-badge>
        <mk-api-badge [arazzo]="true" name="Restock a pastry" version="1.2.0"></mk-api-badge>
      </div>`,
  }),
};

export const StandardProofs: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-api-badge label="conformance" value="92%" status="success"></mk-api-badge>
        <mk-api-badge label="last test" value="✕ failed" status="danger"></mk-api-badge>
        <mk-api-badge label="mcp" value="agent-ready" status="info"></mk-api-badge>
        <mk-api-badge label="samples" value="3 + 2 AI" status="warning"></mk-api-badge>
      </div>`,
  }),
};

export const MethodTags: S = {
  render: () => ({
    template: `
      <div class="di-stack">
        <mk-method-tag method="GET" protocol="REST"></mk-method-tag>
        <mk-method-tag method="PATCH" protocol="REST"></mk-method-tag>
        <mk-method-tag method="SUBSCRIBE" protocol="EVENT"></mk-method-tag>
        <mk-method-tag method="SayHello" protocol="gRPC"></mk-method-tag>
        <mk-method-tag method="QUERY" protocol="GRAPHQL"></mk-method-tag>
        <mk-method-tag method="POST" protocol="SOAP"></mk-method-tag>
      </div>`,
  }),
};
