import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Chip, type Protocol } from '@microcks/deep-ink';
import { FilterBar, FilterReset, FilterRow, FilterSearch } from '@microcks/deep-ink';
import { Segmented } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/FilterBar',
  component: FilterBar,
  parameters: itemParams(['filter-bar', 'chip', 'segmented'], 'A named box of filter rows: a search field, titled rows of chips or segmented controls, and a Reset that writes the number of active filters.'),
} satisfies Meta<typeof FilterBar>;

const PROTOCOLS: Array<[Protocol, number]> = [['REST', 4], ['SOAP', 1], ['EVENT', 2], ['GRAPHQL', 1]];

export const Catalogue: StoryObj = {
  render: function Render() {
    const [q, setQ] = useState('');
    const [result, setResult] = useState('all');
    const [proto, setProto] = useState<Protocol | null>(null);
    const active = (q ? 1 : 0) + (result !== 'all' ? 1 : 0) + (proto ? 1 : 0);
    return (
      <FilterBar label="Catalogue filters" style={{ maxWidth: 1100 }}>
        <FilterRow>
          <FilterSearch label="Search APIs and services" value={q} onChange={(e) => setQ(e.target.value)} />
          <Segmented
            label="Last test"
            value={result}
            onChange={setResult}
            options={[
              { id: 'all', label: 'All', count: 11, dot: 'neutral' },
              { id: 'ok', label: 'Conformant', count: 3, dot: 'success' },
              { id: 'ko', label: 'Failing', count: 5, dot: 'danger' },
            ]}
          />
        </FilterRow>
        <FilterRow title="Protocol">
          {PROTOCOLS.map(([p, n]) => (
            <Chip key={p} protocol={p} count={n} pressed={proto === p} onClick={() => setProto(proto === p ? null : p)}>
              {p}
            </Chip>
          ))}
          <FilterReset
            count={active}
            onClick={() => {
              setQ('');
              setResult('all');
              setProto(null);
            }}
          />
        </FilterRow>
      </FilterBar>
    );
  },
};

/** `FilterReset` takes a `label` and shows the number of active filters. */
export const ResetLabel: StoryObj = {
  name: 'Reset button label',
  render: () => (
    <FilterBar label="Filter runs">
      <FilterSearch label="Search runs" placeholder="Run number" />
      <FilterReset count={3} label="Clear filters" />
    </FilterBar>
  ),
};

export const PageSearch: StoryObj = {
  name: 'Page search and category pills (Hub)',
  render: function Render() {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('');
    const cats: Array<[string, number]> = [['All', 8], ['Samples', 3], ['Banking', 1], ['Retail', 2]];
    return (
      <div className="stack">
        <div className="inline">
          <FilterSearch size="lg" label="Search packages and APIs" placeholder="Search packages, APIs, protocols…" value={q} onChange={(e) => setQ(e.target.value)} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>8 packages · 22 APIs</span>
        </div>
        <div className="inline" role="group" aria-label="Categories">
          {cats.map(([c, n]) => (
            <Chip key={c} size="lg" count={n} pressed={(cat || 'All') === c} onClick={() => setCat(c === 'All' ? '' : c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
    );
  },
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof FilterBar> = {
  args: {
    label: 'Filter services',
    children: (
      <>
        <FilterRow title="Search"><FilterSearch label="Search services" placeholder="Search by name" size="md" /></FilterRow>
        <FilterRow title="Protocol"><Chip protocol="REST">REST</Chip><Chip protocol="EVENT">EVENT</Chip></FilterRow>
        <FilterReset count={2} label="Reset" />
      </>
    ),
  },
};
