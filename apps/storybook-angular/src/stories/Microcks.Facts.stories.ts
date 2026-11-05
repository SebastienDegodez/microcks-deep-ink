import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { FACTS } from '@microcks-deep-ink/registry/angular/facts';
import { argTypesFor, itemParams, playground } from './_meta';

const meta: Meta = {
  title: 'Microcks/Facts',
  argTypes: argTypesFor('facts'),
  decorators: [moduleMetadata({ imports: [...FACTS] })],
  parameters: itemParams(['facts'], 'Key/value facts in a native dl. Rows (term column and separators), inline (two-column grid) or columns (term over value). Tones colour a value; the words carry the meaning.'),
};
export default meta;

export const Rows: StoryObj = {
  render: () => ({
    props: {
      items: [
        { term: 'Origin', value: 'GitLab repository', sub: 'Synced every hour' },
        { term: 'Artifact', value: 'Primary · OPEN_API_SPEC', mono: true, sub: 'Creates or updates Services from this contract' },
        { term: 'Secret', value: 'None, public resource' },
        { term: 'TLS validation', value: 'Enabled' },
      ],
    },
    template: `<dl mkFacts [items]="items" style="max-width: 560px"><div mkFactRow term="Statistics"><span>1,322 calls over 7 days <a href="#/usage">Usage details</a></span></div></dl>`,
  }),
};

/** Row options: `sub` text, `mono` value and a `tone` on `mkFactRow`. */
export const RowOptions: StoryObj = {
  name: 'Row options (sub, mono, tone)',
  render: () => ({
    template: `
      <dl mkFacts style="max-width:520px">
        <div mkFactRow term="Endpoint" sub="Mock URL" [mono]="true" tone="success">/rest/API+Pastry/2.0.0</div>
        <div mkFactRow term="Last sync" tone="muted">Never</div>
      </dl>
    `,
  }),
};

export const Inline: StoryObj = {
  render: () => ({
    props: {
      items: [
        { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', mono: true },
        { term: 'Runner', value: 'A2A_CONFORMANCE', mono: true },
        { term: 'Result', value: '13/15 checks passed', mono: true, tone: 'danger' },
      ],
    },
    template: `<dl mkFacts layout="inline" [boxed]="true" termWidth="120px" [items]="items" style="max-width: 560px"></dl>`,
  }),
};

export const Columns: StoryObj = {
  render: () => ({
    props: {
      session: [{ term: 'Inputs', value: 'size=M · newPrice=3.9', mono: true }, { term: 'Steps set to fail', value: 'none' }, { term: 'Verification', value: 'Failed · #13', tone: 'danger' }],
      stats: [{ term: 'Duration', value: '1.84 s', mono: true }, { term: 'Calls', value: '6', mono: true }, { term: 'Steps', value: '4 passed' }],
    },
    template: `<div style="display: flex; flex-direction: column; gap: 24px; max-width: 640px"><dl mkFacts layout="columns" [items]="session"></dl><dl mkFacts layout="columns" [columns]="3" [strong]="true" [items]="stats"></dl></div>`,
  }),
};

export const SurfaceAndGap: StoryObj = {
  name: "Boxed on surface, custom gap",
  render: () => ({
    props: {
      call: [
        { term: 'Client', value: 'microcks-arazzo · 10.0.2.8', mono: true },
        { term: 'Dispatcher', value: 'URI_PARTS', mono: true },
        { term: 'Dispatch criteria', value: '/name=Eclair Cafe', mono: true, tone: 'warning' },
        { term: 'Matched example', value: 'no match', tone: 'warning' },
      ],
      props: [
        { term: 'Workflow', value: 'restock-pastry', mono: true },
        { term: 'Timeout per step', value: '10000 ms', mono: true },
      ],
    },
    template: `
      <div class="stack" style="max-width: 560px">
        <dl mkFacts layout="columns" [columns]="2" boxed="surface" gap="10px 16px" size="sm" [items]="call"></dl>
        <dl mkFacts layout="inline" gap="9px 12px" [items]="props"></dl>
      </div>
    `,
  }),
};

export const LargeRows: StoryObj = {
  name: 'Large rows (Service)',
  render: () => ({
    props: { items: [{ term: 'Version', value: '2.0', mono: true }, { term: 'Type', value: 'REST · OpenAPI 3.1' }, { term: 'Created', value: 'Oct 12, 2026' }] },
    template: `<dl mkFacts size="lg" termWidth="150px" [items]="items" style="max-width: 560px"></dl>`,
  }),
};

export const SecondaryRelaxed: StoryObj = {
  name: 'Secondary values, relaxed (Agent test)',
  render: () => ({
    props: {
      items: [
        { term: 'Method', value: 'tasks/cancel', mono: true },
        { term: 'Expected', value: 'state = canceled', mono: true, tone: 'success' },
        { term: 'Received', value: 'state = working', mono: true, tone: 'danger' },
        { term: 'Retries', value: 'none', mono: true, tone: 'muted' },
      ],
    },
    template: `<dl mkFacts layout="inline" [boxed]="true" values="secondary" lineHeight="relaxed" termWidth="120px" [items]="items" style="max-width: 560px"></dl>`,
  }),
};

/** Request body (WorkflowRun step): compact frame, 12px/1.6 mono, 32ch term column, pre-wrapped terms and values that break anywhere instead of scrolling. */
export const RequestBody: StoryObj = {
  name: 'Request body (compact, mono, pre-wrap)',
  render: () => ({
    props: {
      items: [
        { term: 'pastryName', value: 'Eclair Cafe' },
        { term: 'newPrice', value: '3.9' },
        { term: 'a.very.long.parameter.name.that.wraps.at.the.term.width', value: 'https://microcks.acme.io/rest/API+Pastry/2.0/pastries/Eclair%20Cafe?withSomeVeryLongQueryString=true' },
        { term: 'note', value: 'Restock before 7am.\nKeep the cold chain.' },
      ],
    },
    template: `<dl mkFacts layout="inline" boxed="compact" mono wrap="pre" termWidth="32ch" gap="2px 0" [items]="items" style="max-width: 560px"></dl>`,
  }),
};

/** Interactive: every input of the component is a control in the Controls panel. */
export const Playground: StoryObj = playground('facts', 'FactsComponent', {
  items: [{ term: 'Service', value: 'API Pastry' }, { term: 'Version', value: '2.0.0', mono: true }, { term: 'Status', value: 'Healthy', tone: 'success', sub: 'Last check 2 min ago' }],
  layout: 'rows', boxed: false, strong: false, size: 'md', values: 'text', lineHeight: 'inherit', mono: false, wrap: 'normal',
}, '', 'style="max-width: 560px"');
