import DefaultComposition from './Components.Link/Default.svelte';
import PlaygroundComposition from './Components.Link/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Link } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/Link',
  component: Link,
  parameters: itemParams(['link', 'icon'], 'Always underlined in body text. An external link adds an icon, a hidden "(opens in a new tab)" and `rel="noopener"`.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { href: '#docs', children: 'Read the Arazzo guide', external: false },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
