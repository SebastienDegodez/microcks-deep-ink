import exampleSource0 from './Components.ThemeToggle/Default.svelte?raw';
import exampleSource1 from './Components.ThemeToggle/Playground.svelte?raw';
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
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  args: {  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
