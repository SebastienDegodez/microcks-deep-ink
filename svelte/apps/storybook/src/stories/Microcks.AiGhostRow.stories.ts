import exampleSource0 from './Microcks.AiGhostRow.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { AiGhostRow } from '@microcks/deep-ink';
import AiGhostRowStory from './Microcks.AiGhostRow.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/AiGhostRow', component: AiGhostRow, parameters: itemParams(['ai-ghost-row','button','icon','method-tag'], 'A suggestion that is not saved until accepted. The group is named "AI suggestion: <name>" and each button repeats the name for screen readers ("Accept getPastry example").') } satisfies Meta<typeof AiGhostRow>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: AiGhostRowStory, props: { variant: 'Default' } })) as never });
export const Busy = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: AiGhostRowStory, props: { variant: 'Busy' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, args: { name: 'listPastries', busy: false, onaccept: () => undefined, onedit: () => undefined, onreject: () => undefined }, render: ((args: Record<string, unknown>) => ({ Component: AiGhostRowStory, props: { variant: 'Playground', ...args } })) as never, argTypes: { onaccept: { table: { disable: true } }, onedit: { table: { disable: true } }, onreject: { table: { disable: true } }, children: { control: false } } });
