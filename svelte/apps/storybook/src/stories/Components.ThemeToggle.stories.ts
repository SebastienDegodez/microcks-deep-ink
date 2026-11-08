import DefaultComposition from './Components.ThemeToggle/Default.svelte';
import PlaygroundComposition from './Components.ThemeToggle/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { ThemeToggle } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: itemParams(['theme-toggle', 'button', 'icon'], 'An icon-only `aria-pressed` button named "Light theme". It sets `data-theme` on `<html>`, remembers the choice (`microcks-theme`) and dispatches `microcks-theme-change`.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: {  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
