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
  render: () => ({ Component: DefaultComposition })
};

/** `size="sm"` for dense toolbars; `surface="bg"` on a field that sits on a panel. */
export const Small: StoryObj<typeof SmallComposition> = {
  render: () => ({ Component: SmallComposition })
};

export const Mono: StoryObj<typeof MonoComposition> = {
  render: () => ({ Component: MonoComposition })
};

export const Invalid: StoryObj<typeof InvalidComposition> = {
  render: () => ({ Component: InvalidComposition })
};

export const Multiline: StoryObj<typeof MultilineComposition> = {
  render: () => ({ Component: MultilineComposition })
};

export const Disabled: StoryObj<typeof DisabledComposition> = {
  render: () => ({ Component: DisabledComposition })
};

export const OnPageBackground: StoryObj<typeof OnPageBackgroundComposition> = {
  name: 'On the page background',
  render: () => ({ Component: OnPageBackgroundComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { 'aria-label': 'Search services', placeholder: 'Search services', size: 'md', mono: false, surface: undefined, type: 'text', disabled: false },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    surface: { control: 'inline-radio', options: [undefined, 'surface', 'bg'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
