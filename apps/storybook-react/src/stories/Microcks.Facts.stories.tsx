import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { FactRow, Facts } from '@microcks-deep-ink/registry/react/facts';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/Facts',
  component: Facts,
  parameters: itemParams(['facts'], 'Key/value facts in a native dl. Rows (term column and separators), inline (two-column grid) or columns (term over value). Tones colour a value; the words carry the meaning.'),
} satisfies Meta<typeof Facts>;

export const Rows: StoryObj = {
  render: () => (
    <Facts
      style={{ maxWidth: 560 }}
      items={[
        { term: 'Origin', value: 'GitLab repository', sub: 'Synced every hour' },
        { term: 'Artifact', value: 'Primary · OPEN_API_SPEC', mono: true, sub: 'Creates or updates Services from this contract' },
        { term: 'Secret', value: 'None, public resource' },
        { term: 'TLS validation', value: 'Enabled' },
      ]}
    >
      <FactRow term="Statistics">
        <span>1,322 calls over 7 days <a href="#/usage">Usage details</a></span>
      </FactRow>
    </Facts>
  ),
};

export const Inline: StoryObj = {
  render: () => (
    <Facts
      layout="inline"
      boxed
      termWidth="120px"
      style={{ maxWidth: 560 }}
      items={[
        { term: 'Endpoint', value: 'https://concierge.acme.io/a2a', mono: true },
        { term: 'Runner', value: 'A2A_CONFORMANCE', mono: true },
        { term: 'Result', value: '13/15 checks passed', mono: true, tone: 'danger' },
      ]}
    />
  ),
};

export const Columns: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <Facts layout="columns" items={[{ term: 'Inputs', value: 'size=M · newPrice=3.9', mono: true }, { term: 'Steps set to fail', value: 'none' }, { term: 'Verification', value: 'Failed · #13', tone: 'danger' }]} />
      <Facts layout="columns" columns={3} strong items={[{ term: 'Duration', value: '1.84 s', mono: true }, { term: 'Calls', value: '6', mono: true }, { term: 'Steps', value: '4 passed' }]} />
    </div>
  ),
};

export const SurfaceAndGap: StoryObj = {
  name: 'Boxed on surface, custom gap',
  render: () => (
    <div className="stack" style={{ maxWidth: 560 }}>
      <Facts
        layout="columns"
        columns={2}
        boxed="surface"
        gap="10px 16px"
        size="sm"
        items={[
          { term: 'Client', value: 'microcks-arazzo · 10.0.2.8', mono: true },
          { term: 'Dispatcher', value: 'URI_PARTS', mono: true },
          { term: 'Dispatch criteria', value: '/name=Eclair Cafe', mono: true, tone: 'warning' },
          { term: 'Matched example', value: 'no match', tone: 'warning' },
        ]}
      />
      <Facts
        layout="inline"
        gap="9px 12px"
        items={[
          { term: 'Workflow', value: 'restock-pastry', mono: true },
          { term: 'Timeout per step', value: '10000 ms', mono: true },
        ]}
      />
    </div>
  ),
};

export const LargeRows: StoryObj = {
  name: 'Large rows (Service)',
  render: () => <Facts size="lg" termWidth="150px" style={{ maxWidth: 560 }} items={[{ term: 'Version', value: '2.0', mono: true }, { term: 'Type', value: 'REST · OpenAPI 3.1' }, { term: 'Created', value: 'Oct 12, 2026' }]} />,
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Facts> = {
  args: {
    items: [{ term: 'Service', value: 'API Pastry' }, { term: 'Version', value: '2.0.0', mono: true }, { term: 'Status', value: 'Healthy', tone: 'success', sub: 'Last check 2 min ago' }],
    layout: 'rows', boxed: false, strong: false, size: 'md', termWidth: undefined, columns: undefined, gap: undefined,
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['rows', 'inline', 'columns'] },
    boxed: { control: 'inline-radio', options: [false, true, 'surface'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};
