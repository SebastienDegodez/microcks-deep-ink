import exampleSource0 from './Microcks.Tile/Packages.svelte?raw';
import exampleSource1 from './Microcks.Tile/PackageTile.svelte?raw';
import exampleSource2 from './Microcks.Tile/Links.svelte?raw';
import exampleSource3 from './Microcks.Tile/Static.svelte?raw';
import exampleSource4 from './Microcks.Tile/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Tile } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import PackagesView from './Microcks.Tile/Packages.svelte';
import LinksView from './Microcks.Tile/Links.svelte';
import StaticView from './Microcks.Tile/Static.svelte';
import PlaygroundView, { defaultAside } from './Microcks.Tile/Playground.svelte';

export default {
  title: 'Microcks/Tile',
  component: Tile,
  parameters: itemParams(['tile', 'api-badge', 'button'], 'A card in a wrapping grid. The title is the one link (or toggle button) of the tile, stretched over it, so the whole card is clickable without nesting controls. Footer controls stay separate.'),
} satisfies Meta<typeof Tile>;


export const Packages: StoryObj<typeof PackagesView> = {
  parameters: { docs: { source: { code: ["<!-- Microcks.Tile/Packages.svelte -->", exampleSource0, "<!-- Microcks.Tile/PackageTile.svelte -->", exampleSource1].join('\n\n'), language: 'svelte', type: 'code' } } }, name: 'Hub packages (selectable)', render: () => ({ Component: PackagesView, props: {} }) };

export const Links: StoryObj<typeof LinksView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Link tiles (services)', render: () => ({ Component: LinksView, props: {} }) };

export const Static: StoryObj<typeof StaticView> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, name: 'Static tile', render: () => ({ Component: StaticView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Tile> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { title: 'API Pastry', headingLevel: 3, meta: 'REST · 2.0', aside: defaultAside, footer: '12 operations', selected: false, as: 'article' },
  argTypes: { as: { control: 'inline-radio', options: ['article','li','div'] } } };

