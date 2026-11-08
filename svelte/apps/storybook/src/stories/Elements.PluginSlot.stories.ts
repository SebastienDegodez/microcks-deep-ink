import exampleSource0 from './Elements.PluginSlot.svelte?raw';
import exampleSource1 from './Elements.PluginSlot.Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { PluginSlot } from '@microcks/deep-ink';
import { registerDemoPlugin } from '@microcks-deep-ink/storybook-shared/demo-plugin';
import SlotStory from './Elements.PluginSlot.svelte';
import { itemParams } from './_meta';
const eventService = { theme: 'dark' as const, service: { id: 'orders', name: 'Pastry orders API', version: '0.1.0', protocol: 'EVENT' as const } };
const meta = { title: 'Elements/PluginSlot', component: PluginSlot, parameters: itemParams(['plugin-slot', 'panel'], 'Renders the contributions of installed plugins for an extension point, in light DOM, so the design system classes and the tokens reach plugin elements. Each contribution is wrapped in `<div class="plugin-item" data-plugin-id>`. Slot children are the fallback when nothing contributes.'), loaders: [async () => ({ ready: await registerDemoPlugin() })] } satisfies Meta<typeof PluginSlot>;
export default meta;
type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: () => ({ Component: SlotStory, props: { variant: 'Default' } }) });
export const Fallback = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Fallback content', render: () => ({ Component: SlotStory, props: { variant: 'Fallback' } }) });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, args: { point: 'cockpit.widgets', context: eventService, outlined: true }, argTypes: { point: { control: 'select', options: ['cockpit.widgets', 'service.tabs', 'operation.panels', 'nav.items'] } }, render: (args: object) => ({ Component: SlotPlayground, props: args }) });
import SlotPlayground from './Elements.PluginSlot.Playground.svelte';
