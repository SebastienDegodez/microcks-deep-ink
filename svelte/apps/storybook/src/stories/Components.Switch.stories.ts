import exampleSource0 from './Components.Switch/Default.svelte?raw';
import exampleSource1 from './Components.Switch/WithDescription.svelte?raw';
import exampleSource2 from './Components.Switch/Disabled.svelte?raw';
import exampleSource3 from './Components.Switch/Large.svelte?raw';
import exampleSource4 from './Components.Switch/Playground.svelte?raw';
import DefaultComposition from './Components.Switch/Default.svelte';
import WithDescriptionComposition from './Components.Switch/WithDescription.svelte';
import DisabledComposition from './Components.Switch/Disabled.svelte';
import LargeComposition from './Components.Switch/Large.svelte';
import PlaygroundComposition from './Components.Switch/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Switch } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Switch',
  component: Switch,
  parameters: itemParams(['switch'], 'A native checkbox with `role="switch"`. The state is the checked state: the track also shows a mark, so it is not color only.'),
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

export const Large: StoryObj<typeof LargeComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: LargeComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  args: { label: 'Send a Slack message', description: 'When a test fails.', checked: false, size: 'md', disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'lg'] }, oncheckedchange: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
