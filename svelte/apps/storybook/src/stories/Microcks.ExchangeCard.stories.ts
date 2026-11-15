import exampleSource0 from './Microcks.ExchangeCard/ServiceExample.svelte?raw';
import exampleSource1 from './Microcks.ExchangeCard/StatusTones.svelte?raw';
import exampleSource2 from './Microcks.ExchangeCard/Compact.svelte?raw';
import exampleSource3 from './Microcks.ExchangeCard/Playground.svelte?raw';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ExchangeCard } from '@microcks/deep-ink';
import { itemParams } from './_meta';

import ServiceExampleView from './Microcks.ExchangeCard/ServiceExample.svelte';
import StatusTonesView from './Microcks.ExchangeCard/StatusTones.svelte';
import CompactView from './Microcks.ExchangeCard/Compact.svelte';
import PlaygroundView from './Microcks.ExchangeCard/Playground.svelte';

export default {
  title: 'Microcks/ExchangeCard',
  component: ExchangeCard,
  parameters: itemParams(['exchange-card'], 'A request and its response: named cards with a small head (example name or status) over focusable mono blocks. The status is written; its fill only speeds up scanning.'),
} satisfies Meta<typeof ExchangeCard>;


export const ServiceExample: StoryObj<typeof ServiceExampleView> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } }, name: 'Service example', render: () => ({ Component: ServiceExampleView, props: {} }) };

/** `statusTone` colours the status; `headingLevel` fits the card in the page outline (`none` for no heading). */
export const StatusTones: StoryObj<typeof StatusTonesView> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } }, name: 'Status tones and heading level', render: () => ({ Component: StatusTonesView, props: {} }) };

export const Compact: StoryObj<typeof CompactView> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } }, name: 'Compact head (Copilot)', render: () => ({ Component: CompactView, props: {} }) };

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof ExchangeCard> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } }, render: (args) => ({ Component: PlaygroundView, props: args }),
  args: { title: 'GET /pastries/Millefeuille', label: 'Exchange 1', meta: '42 ms', status: '200 OK', statusTone: 'success', size: 'md', headingLevel: 4, blocks: [{ label: 'Headers', text: 'Accept: application/json', tone: 'headers' }, { label: 'Body', text: '{ "name": "Millefeuille", "price": 3.9 }', tone: 'body' }] },
  argTypes: { statusTone: { control: 'inline-radio', options: ['success','warning','danger'] }, size: { control: 'inline-radio', options: ['md','sm'] }, headingLevel: { control: 'inline-radio', options: [3,4,5,6,'none'] } } };

