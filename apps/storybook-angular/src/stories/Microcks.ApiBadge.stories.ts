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
