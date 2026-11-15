import exampleSource0 from './Components.Checkbox/Default.svelte?raw';
import exampleSource1 from './Components.Checkbox/WithDescription.svelte?raw';
import exampleSource2 from './Components.Checkbox/Disabled.svelte?raw';
import exampleSource3 from './Components.Checkbox/CompactCards.svelte?raw';
import exampleSource4 from './Components.Checkbox/Playground.svelte?raw';
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
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

export const WithDescription: StoryObj<typeof WithDescriptionComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: WithDescriptionComposition, props: {} })
};

export const Disabled: StoryObj<typeof DisabledComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DisabledComposition, props: {} })
};

export const CompactCards: StoryObj<typeof CompactCardsComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'Compact cards (dense list)',
  render: () => ({ Component: CompactCardsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  args: { label: 'Run on every push', description: 'The test starts from your CI pipeline.', variant: 'plain', disabled: false },
  argTypes: { variant: { control: 'inline-radio', options: ['plain', 'card', 'compact'] } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
