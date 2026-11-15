import exampleSource0 from './Components.AppShell/Default.svelte?raw';
import exampleSource1 from './Components.AppShell/Playground.svelte?raw';
import exampleSource2 from './Components.AppShell/Customised.svelte?raw';
import DefaultComposition from './Components.AppShell/Default.svelte';
import { children } from './Components.AppShell/PlaygroundContent.svelte';
import PlaygroundComposition from './Components.AppShell/Playground.svelte';
import CustomisedComposition from './Components.AppShell/Customised.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { AppShell } from '@microcks/deep-ink';
import { Callout } from '@microcks/deep-ink';
import { ThemeToggle } from '@microcks/deep-ink';
import { itemParams } from './_meta';
const NAV = [
  { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' as const },
  { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' as const },
  { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests' as const, badge: '2' },
  { id: 'sources', label: 'Sources', href: '#sources', icon: 'sources' as const },
  { id: 'hub', label: 'Hub', href: '#hub', icon: 'hub' as const },
];

export default {
  title: 'Components/AppShell',
  component: AppShell,
  parameters: itemParams(['app-shell', 'theme-toggle', 'icon', 'button'], 'Skip link, banner, main navigation (`aria-current="page"`) and `<main>`. Below 768px the navigation collapses behind a disclosure button. Pass `renderLink` to use your router.', { layout: 'fullscreen' }),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  parameters: {docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } },  layout: 'fullscreen' },
  args: { brand: 'Microcks', nav: [
      { id: 'cockpit', label: 'Cockpit', href: '#cockpit', icon: 'cockpit' },
      { id: 'apis', label: 'APIs & Services', href: '#apis', icon: 'apis' },
      { id: 'tests', label: 'Tests', href: '#tests', icon: 'tests', badge: '2' },
    ], activeId: 'apis', skipLinkLabel: 'Skip to content', navLabel: 'Main', children: children },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};

/** `navLabel` and `skipLinkLabel` translate the landmark names; `topbarCenter` fills the middle of the top bar; `renderLink` plugs a router link. */
export const Customised: StoryObj<typeof CustomisedComposition> = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  name: 'Labels, centre slot and router link',
  render: () => ({ Component: CustomisedComposition, props: {} })
};
