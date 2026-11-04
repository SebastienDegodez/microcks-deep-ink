import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ApiBadge, type Protocol } from '@microcks-deep-ink/registry/react/api-badge';
import { Button } from '@microcks-deep-ink/registry/react/button';
import { Tile, TileGrid } from '@microcks-deep-ink/registry/react/tile';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/Tile',
  parameters: itemParams(['tile', 'api-badge', 'button'], 'A card in a wrapping grid. The title is the one link (or toggle button) of the tile, stretched over it, so the whole card is clickable without nesting controls. Footer controls stay separate.'),
} satisfies Meta;

interface Pkg {
  id: string;
  name: string;
  category: string;
  meta: string;
  description: string;
  apis: Array<[Protocol, string, string]>;
  totals: string;
}

const PACKAGES: Pkg[] = [
  { id: 'banking', name: 'Open Banking', category: 'Banking', meta: '3 APIs · updated Oct 21, 2026', description: 'Accounts, payments and consents, with examples for every operation.', apis: [['REST', 'Accounts API', '1.2.0'], ['REST', 'Payments API', '1.1.0'], ['EVENT', 'Consent events', '0.3.0']], totals: '9 ops · 19 examples' },
  { id: 'pastry', name: 'Pastry samples', category: 'Samples', meta: '2 APIs · updated Sep 2, 2026', description: 'The bakery demo used across the Microcks docs.', apis: [['REST', 'API Pastry', '2.0'], ['GRAPHQL', 'Pastry graph', '1.0']], totals: '5 ops · 12 examples' },
  { id: 'telco', name: 'CAMARA', category: 'Telco', meta: '4 APIs · updated Aug 14, 2026', description: 'Network APIs of the CAMARA project: quality on demand, device location, SIM swap.', apis: [['REST', 'Quality on demand', '0.10.0']], totals: '14 ops · 40 examples' },
];

function PackageTile({ p, selected, onSelect }: { p: Pkg; selected: boolean; onSelect: () => void }) {
  return (
    <Tile
      title={p.name}
      onSelect={onSelect}
      selected={selected}
      meta={<>maintained by <strong>community</strong> · {p.meta}</>}
      aside={<span className="tile-tag">{p.category}</span>}
      footer={
        <>
          <Button variant="primary" size="sm" icon="download">
            Install <span className="sr-only">{p.name}</span>
          </Button>
          <span className="tile-footer-end">{p.totals}</span>
        </>
      }
    >
      <p>{p.description}</p>
      <div className="tile-badges">
        {p.apis.map(([proto, name, version]) => <ApiBadge key={name} size="sm" protocol={proto} name={name} version={version} />)}
      </div>
    </Tile>
  );
}

export const Packages: StoryObj = {
  name: 'Hub packages (selectable)',
  render: function Render() {
    const [selected, setSelected] = useState('banking');
    return (
      <TileGrid label="Packages" style={{ maxWidth: 760 }}>
        {PACKAGES.map((p) => <PackageTile key={p.id} p={p} selected={selected === p.id} onSelect={() => setSelected(p.id)} />)}
      </TileGrid>
    );
  },
};

export const Links: StoryObj = {
  name: 'Link tiles (services)',
  render: () => (
    <TileGrid label="Services" style={{ maxWidth: 760 }}>
      <Tile title="API Pastry 2.0" href="#/services/pastry2" headingLevel={2} meta="OpenAPI 3.0.2 · 3 operations" aside={<span className="tile-tag">REST</span>}>
        <p>List pastries by size, get a pastry by its name, and update its price.</p>
      </Tile>
      <Tile title="Pastry orders API 0.1.0" href="#/services/orders" headingLevel={2} selected meta="AsyncAPI 2.6 · Kafka" aside={<span className="tile-tag">EVENT</span>}>
        <p>Order events published by the bakery.</p>
      </Tile>
    </TileGrid>
  ),
};

export const Static: StoryObj = {
  name: 'Static tile',
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Tile title="Pastry concierge" meta="A2A Agent Card · spec 1.0">
        <p>No link: the tile is a plain article.</p>
      </Tile>
    </div>
  ),
};
