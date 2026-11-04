import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { FactsComponent } from '@microcks-deep-ink/registry/angular/facts';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/Facts',
  decorators: [moduleMetadata({ imports: [FactsComponent] })],
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
    template: `<dl mkFacts [items]="items" style="max-width: 560px"><div class="facts-row"><dt>Statistics</dt><dd><span>1,322 calls over 7 days <a href="#/usage">Usage details</a></span></dd></div></dl>`,
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
