import exampleSource0 from './Components.Field/Default.svelte?raw';
import exampleSource1 from './Components.Field/Required.svelte?raw';
import exampleSource2 from './Components.Field/WithError.svelte?raw';
import exampleSource3 from './Components.Field/Playground.svelte?raw';
import DefaultComposition from './Components.Field/Default.svelte';
import RequiredComposition from './Components.Field/Required.svelte';
import WithErrorComposition from './Components.Field/WithError.svelte';
import { children } from './Components.Field/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.Field/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Field } from '@microcks/deep-ink';
import { Input } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Field',
  component: Field,
  parameters: itemParams(['field', 'input'], 'Links the visible label, help and error to the control through `id` and `aria-describedby`, and sets `aria-invalid`. The error shows an icon and text, never color alone.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const Required: StoryObj<typeof RequiredComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: RequiredComposition, props: {} })
};

export const WithError: StoryObj<typeof WithErrorComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'Error',
  render: () => ({ Component: WithErrorComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  args: { label: 'Service name', help: 'As written in the contract title.', error: undefined, required: false, children: children },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
