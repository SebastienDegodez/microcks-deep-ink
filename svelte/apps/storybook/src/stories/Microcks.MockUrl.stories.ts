import exampleSource0 from './Microcks.MockUrl.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { MockUrl } from '@microcks/deep-ink';
import MockUrlStory from './Microcks.MockUrl.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/MockUrl', component: MockUrl, parameters: itemParams(['mock-url','method-tag','copy-button','segmented'], 'The contract made copyable: the URL in mono, a snippet format group (URL, curl, HTTPie, MCP tool) and a Copy button with a live announcement.') } satisfies Meta<typeof MockUrl>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: MockUrlStory, props: { variant: 'Default' } })) as never });
export const AgentReady = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Agent-ready (MCP tool)', render: (() => ({ Component: MockUrlStory, props: { variant: 'AgentReady' } })) as never });
export const Bare = story({
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: MockUrlStory, props: { variant: 'Bare' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({
  parameters: { docs: { source: { code: `<script>
  import { MockUrl } from '@microcks/deep-ink';
</script>

<MockUrl url="http://localhost:8080/rest/API+Pastry/2.0.0/pastries" method="GET" bare={false} />`, language: 'svelte', type: 'code' } } }, args: { url: 'http://localhost:8080/rest/API+Pastry/2.0.0/pastries', method: 'GET', bare: false, mcpTool: undefined } });
