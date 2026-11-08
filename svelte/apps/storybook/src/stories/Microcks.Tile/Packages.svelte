<script lang="ts">import { TileGrid, type Protocol } from '@microcks/deep-ink'; import PackageTile from './PackageTile.svelte'; interface Pkg {
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

 let selected = $state('banking');</script><TileGrid label="Packages" style="max-width:760px">{#each PACKAGES as p (p.id)}<PackageTile {p} selected={selected === p.id} onselect={()=>selected=p.id}/>{/each}</TileGrid>
