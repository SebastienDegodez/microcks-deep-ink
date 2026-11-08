import exampleSource0 from './Microcks.StatCard.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { StatCard } from '@microcks/deep-ink';
import StatCardStory from './Microcks.StatCard.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/StatCard', component: StatCard, parameters: itemParams(['stat-card','live-indicator'], 'A key figure: a small heading (a real heading), the figure as text with its unit, and optional detail. The tone colours the figure only; the words carry the meaning.') } satisfies Meta<typeof StatCard>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const KeyFigures = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Key figures', render: (() => ({ Component: StatCardStory, props: { variant: 'KeyFigures' } })) as never });
/** `tone` colours the value; `headingLevel` keeps the page outline right inside a section. */
export const Tones = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: StatCardStory, props: { variant: 'Tones' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({
  parameters: { docs: { source: { code: `<script>
  import { StatCard } from '@microcks/deep-ink';
</script>

<StatCard headingLevel={2} tone="success">
  {#snippet title()}Conformance{/snippet}
  {#snippet value()}92{/snippet}
  {#snippet unit()}%{/snippet}
  Across 12 operations.
</StatCard>`, language: 'svelte', type: 'code' } } }, args: { title: createRawSnippet(() => ({ render: () => 'Conformance' })), headingLevel: 2, value: createRawSnippet(() => ({ render: () => '92' })), unit: createRawSnippet(() => ({ render: () => '%' })), tone: 'success', children: createRawSnippet(() => ({ render: () => 'Across 12 operations.' })) }, argTypes: { tone: { control: 'inline-radio', options: ['neutral','success','warning','danger'] }, headingLevel: { control: 'inline-radio', options: [2,3,4,5,6] } } });
