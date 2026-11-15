import exampleSource0 from './Components.Callout/Default.svelte?raw';
import exampleSource1 from './Components.Callout/LivePolite.svelte?raw';
import exampleSource2 from './Components.Callout/AI.svelte?raw';
import exampleSource3 from './Components.Callout/Live.svelte?raw';
import exampleSource4 from './Components.Callout/Outline.svelte?raw';
import exampleSource5 from './Components.Callout/Playground.svelte?raw';
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
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `live="polite"` announces the callout when it appears. Use it for a message that follows an action. */
export const LivePolite: StoryObj<typeof LivePoliteComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  name: 'Announced (polite and assertive)',
  render: () => ({ Component: LivePoliteComposition, props: {} })
};

export const AI: StoryObj<typeof AIComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'AI generated',
  render: () => ({ Component: AIComposition, props: {} })
};

export const Live: StoryObj<typeof LiveComposition> = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'Announced',
  render: () => ({ Component: LiveComposition, props: {} })
};

export const Outline: StoryObj<typeof OutlineComposition> = {
  parameters: { docs: { source: { code: exampleSource4, language: 'svelte', type: 'code' } } },
  name: 'Outline note',
  render: () => ({ Component: OutlineComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource5, language: 'svelte', type: 'code' } } },
  args: { tone: 'info', title: 'Contract imported', children: '12 operations were found in the OpenAPI file.', variant: 'filled', size: 'md', live: false },
  argTypes: {
    tone: { control: 'select', options: ['info', 'success', 'warning', 'danger', 'ai'] },
    variant: { control: 'inline-radio', options: ['filled', 'outline'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    live: { control: 'inline-radio', options: [false, 'polite', 'assertive'] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
