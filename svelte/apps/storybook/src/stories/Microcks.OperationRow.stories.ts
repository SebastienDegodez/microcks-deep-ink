import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { OperationRow } from '@microcks/deep-ink';
import OperationRowStory from './Microcks.OperationRow.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/OperationRow', component: OperationRow, parameters: itemParams(['operation-row','method-tag','mock-url'], 'A list of operations. Each row is a link or a button (never a clickable `<div>`); the selected row has `aria-current="true"` and reveals its mock URL.') } satisfies Meta<typeof OperationRow>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Default = story({ render: (() => ({ Component: OperationRowStory, props: { variant: 'Default' } })) as never });
/** `protocol` colours the method tag and `mockUrl` shows the mock endpoint under the path. */
export const ProtocolAndMockUrl = story({ name: 'Protocol and mock URL', render: (() => ({ Component: OperationRowStory, props: { variant: 'ProtocolAndMockUrl' } })) as never });
export const AsLinks = story({ name: 'Links', render: (() => ({ Component: OperationRowStory, props: { variant: 'AsLinks' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { method: 'GET', path: '/pastries/{name}', protocol: 'REST', meta: '3 examples', mockUrl: undefined, selected: false, href: undefined, onselect: () => undefined }, render: ((args: Record<string, unknown>) => ({ Component: OperationRowStory, props: { variant: 'Playground', ...args } })) as never, argTypes: { protocol: { control: 'select', options: ['REST','SOAP','EVENT','gRPC','GRAPHQL','DIRECT','A2A'] } } });
