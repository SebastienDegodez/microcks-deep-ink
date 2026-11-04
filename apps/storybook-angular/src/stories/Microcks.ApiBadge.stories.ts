import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { ApiBadgeComponent } from '@microcks-deep-ink/registry/angular/api-badge';
import type { Protocol } from '@microcks-deep-ink/registry/angular/api-badge';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/ApiBadge',
  decorators: [moduleMetadata({ imports: [ApiBadgeComponent] })],
  parameters: itemParams(['api-badge', 'icon'], "Three segments: type, name, version. The visible text is the accessible name (\"REST API Pastry 2.0\"). The Arazzo variant inverts the left segment and never uses a protocol color."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    props: {
      protocols: [
        ['REST', 'API Pastry', '2.0'],
        ['SOAP', 'HelloService', '0.9'],
        ['EVENT', 'Pastry orders API', '0.1.0'],
        ['gRPC', 'HelloService', 'v1'],
        ['GRAPHQL', 'Movie Graph', '1.0'],
        ['DIRECT', 'Direct', '1.0'],
        ['A2A', 'Pastry concierge', '1.0'],
      ] as Array<[Protocol, string, string]>,
    },
    template: `
      <div class="inline">
        @for (p of protocols; track p[0]) {
          <span mkApiBadge [protocol]="p[0]" [name]="p[1]" [version]="p[2]"></span>
        }
      </div>
    `,
  }),
};

export const Small: StoryObj = {
  render: () => ({
    template: `
<span mkApiBadge size="sm" protocol="REST" name="API Pastry" version="2.0"></span>
    `,
  }),
};

export const Workflow: StoryObj = {
  name: "Arazzo workflow",
  render: () => ({
    template: `
<span mkApiBadge arazzo name="restock-pastry"></span>
    `,
  }),
};

export const Proof: StoryObj = {
  render: () => ({
    template: `
      <div class="inline">
        <span mkApiBadge label="conformance" value="92 %" status="success"></span>
        <span mkApiBadge label="last run" value="2 failures" status="danger"></span>
        <span mkApiBadge label="drift" value="1 field" status="warning"></span>
        <span mkApiBadge label="replayed" value="1,204 msgs"></span>
      </div>
    `,
  }),
};

export const PageHeader: StoryObj = {
  name: "Page header sizes",
  render: () => ({
    template: `
      <div class="stack">
        <h1 style="margin: 0"><span mkApiBadge size="xl" protocol="REST" name="API Pastry" version="2.0"></span></h1>
        <span mkApiBadge size="lg" protocol="REST" name="API Pastry" version="2.0"></span>
      </div>
    `,
  }),
};

export const ProofValues: StoryObj = {
  name: "Proof with several values",
  render: () => ({
    props: { values: [{ value: '+1 AI', status: 'warning' }] },
    template: `<span mkApiBadge label="samples" value="7" [values]="values"></span>`,
  }),
};

export const Card: StoryObj = {
  name: "Card (badge wall)",
  render: () => ({
    template: `
      <div class="stack" style="max-width: 260px">
        <span mkApiBadge size="card" protocol="REST" name="API Pastry" version="2.0"></span>
        <span mkApiBadge size="card" protocol="EVENT" name="Pastry orders API with a long name" version="0.1.0"></span>
        <span mkApiBadge label="conformance" value="untested" status="neutral"></span>
      </div>
    `,
  }),
};

export const CompactAndMuted: StoryObj = {
  name: 'Compact rows, neutral and muted proofs',
  render: () => ({
    template: `
<div class="inline">
  <span mkApiBadge size="compact" protocol="REST" name="API Pastry" version="2.0"></span>
  <span mkApiBadge size="sm" protocol="REST" name="4"></span>
  <span mkApiBadge size="compact" label="last import" value="inactive" status="muted"></span>
  <span mkApiBadge size="card" label="conformance" value="untested" status="neutral"></span>
</div>
    `,
  }),
};

export const WorkflowHeader: StoryObj = {
  name: 'Workflow title and unfilled proofs',
  render: () => ({
    template: `
<div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start">
  <span mkApiBadge [arazzo]="true" name="Restock a pastry" version="1.2.0" size="xl"></span>
  <div class="inline">
    <span mkApiBadge size="compact" label="target" value="Implementations · schema validation" status="plain"></span>
    <span mkApiBadge size="compact" label="runs · 7 d" value="2/4 passed" status="text"></span>
    <span mkApiBadge size="compact" label="mock url" value="ready" status="positive"></span>
  </div>
</div>
    `,
  }),
};

export const ProofIcons: StoryObj = {
  name: "Proof icons, protocol fill, icon-only",
  render: () => ({
    template: `
      <div class="inline">
        <span mkApiBadge size="compact" label="result" value="failed" status="danger" icon="close-sm"></span>
        <span mkApiBadge size="compact" label="result" value="passed" status="success" icon="check"></span>
        <span mkApiBadge size="compact" label="last test" value="13/15" status="danger" icon="close-sm"></span>
        <span mkApiBadge size="compact" label="skills" value="3" status="protocol" protocol="A2A"></span>
        <span mkApiBadge size="compact" label="streaming" status="success" icon="check" iconLabel="supported"></span>
        <span mkApiBadge protocol="REST" name="API Pastry" version="2.0" versionTone="text"></span>
      </div>
    `,
  }),
};
