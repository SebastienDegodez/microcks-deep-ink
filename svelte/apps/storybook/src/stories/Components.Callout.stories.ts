import DefaultComposition from './Components.Callout/Default.svelte';
import LivePoliteComposition from './Components.Callout/LivePolite.svelte';
import AIComposition from './Components.Callout/AI.svelte';
import LiveComposition from './Components.Callout/Live.svelte';
import OutlineComposition from './Components.Callout/Outline.svelte';
import PlaygroundComposition from './Components.Callout/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button } from '@microcks/deep-ink';
import { Callout } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Callout',
  component: Callout,
  parameters: itemParams(['callout', 'button'], 'Tone is carried by an icon and a title as well as color. Use `live` only for a message that appears after an action; a static callout is not announced.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** `live="polite"` announces the callout when it appears. Use it for a message that follows an action. */
export const LivePolite: StoryObj<typeof LivePoliteComposition> = {
  name: 'Announced (polite and assertive)',
  render: () => ({ Component: LivePoliteComposition })
};

export const AI: StoryObj<typeof AIComposition> = {
  name: 'AI generated',
  render: () => ({ Component: AIComposition })
};

export const Live: StoryObj<typeof LiveComposition> = {
  name: 'Announced',
  render: () => ({ Component: LiveComposition })
};

export const Outline: StoryObj<typeof OutlineComposition> = {
  name: 'Outline note',
  render: () => ({ Component: OutlineComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { tone: 'info', title: 'Contract imported', children: '12 operations were found in the OpenAPI file.', variant: 'filled', size: 'md', live: false },
  argTypes: {
    tone: { control: 'select', options: ['info', 'success', 'warning', 'danger', 'ai'] },
    variant: { control: 'inline-radio', options: ['filled', 'outline'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    live: { control: 'inline-radio', options: [false, 'polite', 'assertive'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
