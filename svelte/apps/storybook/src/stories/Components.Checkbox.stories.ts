import DefaultComposition from './Components.Checkbox/Default.svelte';
import WithDescriptionComposition from './Components.Checkbox/WithDescription.svelte';
import DisabledComposition from './Components.Checkbox/Disabled.svelte';
import CompactCardsComposition from './Components.Checkbox/CompactCards.svelte';
import PlaygroundComposition from './Components.Checkbox/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Checkbox } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: itemParams(['checkbox'], 'A native checkbox inside its label. The description is linked with `aria-describedby`.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const WithDescription: StoryObj<typeof WithDescriptionComposition> = {
  render: () => ({ Component: WithDescriptionComposition, props: {} })
};

export const Disabled: StoryObj<typeof DisabledComposition> = {
  render: () => ({ Component: DisabledComposition, props: {} })
};

export const CompactCards: StoryObj<typeof CompactCardsComposition> = {
  name: 'Compact cards (dense list)',
  render: () => ({ Component: CompactCardsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Run on every push', description: 'The test starts from your CI pipeline.', variant: 'plain', disabled: false },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
