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
  render: () => ({ Component: DefaultComposition })
};

export const Required: StoryObj<typeof RequiredComposition> = {
  render: () => ({ Component: RequiredComposition })
};

export const WithError: StoryObj<typeof WithErrorComposition> = {
  name: 'Error',
  render: () => ({ Component: WithErrorComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Service name', help: 'As written in the contract title.', error: undefined, required: false, children: children },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
