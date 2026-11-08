import exampleSource0 from './Patterns.ServicePage.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import ServicePage from './Patterns.ServicePage.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Patterns/Service page', parameters: itemParams(['panel', 'tabs', 'api-badge', 'conformance-band', 'operation-row', 'status-badge', 'description-list', 'button'], 'A service detail page built only from registry items: proof badges and conformance in the header, tabs for the sections, the operation list with the mock URL of the selected one.', { layout: 'padded' }) } satisfies Meta;
export default meta;
export const Default: StoryObj<typeof meta> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, render: (() => ({ Component: ServicePage, props: {} })) as never };
