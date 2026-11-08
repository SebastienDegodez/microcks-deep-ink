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
  render: () => ({ Component: DefaultComposition })
};

export const WithDescription: StoryObj<typeof WithDescriptionComposition> = {
  render: () => ({ Component: WithDescriptionComposition })
};

export const Disabled: StoryObj<typeof DisabledComposition> = {
  render: () => ({ Component: DisabledComposition })
};

export const Large: StoryObj<typeof LargeComposition> = {
  render: () => ({ Component: LargeComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Send a Slack message', description: 'When a test fails.', checked: false, size: 'md', disabled: false },
  argTypes: { size: { control: 'inline-radio', options: ['md', 'lg'] }, oncheckedchange: { table: { disable: true } } },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
