import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Chip, type Protocol } from '@microcks-deep-ink/registry/react/chip';
import { FilterBar, FilterReset, FilterRow, FilterSearch } from '@microcks-deep-ink/registry/react/filter-bar';
import { Segmented } from '@microcks-deep-ink/registry/react/segmented';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/FilterBar',
  parameters: itemParams(['filter-bar', 'chip', 'segmented'], 'A named box of filter rows: a search field, titled rows of chips or segmented controls, and a Reset that writes the number of active filters.'),
} satisfies Meta;

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
