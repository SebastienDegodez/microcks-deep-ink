import exampleSource0 from './Components.Input/Default.svelte?raw';
import exampleSource1 from './Components.Input/Small.svelte?raw';
import exampleSource2 from './Components.Input/Mono.svelte?raw';
import exampleSource3 from './Components.Input/Invalid.svelte?raw';
import exampleSource4 from './Components.Input/Multiline.svelte?raw';
import exampleSource5 from './Components.Input/Disabled.svelte?raw';
import exampleSource6 from './Components.Input/OnPageBackground.svelte?raw';
import exampleSource7 from './Components.Input/Playground.svelte?raw';
import DefaultComposition from './Components.Input/Default.svelte';
import SmallComposition from './Components.Input/Small.svelte';
import MonoComposition from './Components.Input/Mono.svelte';
import InvalidComposition from './Components.Input/Invalid.svelte';
import MultilineComposition from './Components.Input/Multiline.svelte';
import DisabledComposition from './Components.Input/Disabled.svelte';
import OnPageBackgroundComposition from './Components.Input/OnPageBackground.svelte';
import PlaygroundComposition from './Components.Input/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Input, Textarea } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Input',
  component: Input,
  parameters: itemParams(['input'], 'Native `<input>` and `<textarea>`. The border uses `--border-control` (3:1 against every ground). Always pair with a visible label, see Field.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `size="sm"` for dense toolbars; `surface="bg"` on a field that sits on a panel. */
export const Small: StoryObj<typeof SmallComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: SmallComposition, props: {} })
};

export const Mono: StoryObj<typeof MonoComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: MonoComposition, props: {} })
};

export const Invalid: StoryObj<typeof InvalidComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: InvalidComposition, props: {} })
};

export const Multiline: StoryObj<typeof MultilineComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: MultilineComposition, props: {} })
};

export const Disabled: StoryObj<typeof DisabledComposition> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DisabledComposition, props: {} })
};

export const OnPageBackground: StoryObj<typeof OnPageBackgroundComposition> = {
  parameters: { docs: { source: { code: exampleSource6, language: 'svelte', type: 'code' } } },
  name: 'On the page background',
  render: () => ({ Component: OnPageBackgroundComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource7, language: 'svelte', type: 'code' } } },
  args: { 'aria-label': 'Search services', placeholder: 'Search services', size: 'md', mono: false, surface: undefined, type: 'text', disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    surface: { control: 'inline-radio', options: [undefined, 'surface', 'bg'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
