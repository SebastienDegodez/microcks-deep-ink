import DefaultComposition from './Components.Tabs/Default.svelte';
import IdPrefixComposition from './Components.Tabs/IdPrefix.svelte';
import ManualActivationComposition from './Components.Tabs/ManualActivation.svelte';
import WithDisabledTabComposition from './Components.Tabs/WithDisabledTab.svelte';
import LiveAndAlertComposition from './Components.Tabs/LiveAndAlert.svelte';
import CardWithIconsComposition from './Components.Tabs/CardWithIcons.svelte';
import PlaygroundComposition from './Components.Tabs/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { TabPanel, Tabs } from '@microcks/deep-ink';
import { SERVICE_TABS } from '@microcks-deep-ink/storybook-shared/fixtures';
import { itemParams } from './_meta';
const SOURCE_TABS = [
  { id: 'file', label: 'Upload', hint: 'one-off file', icon: 'document' as const },
  { id: 'url', label: 'URL', hint: 'fetched on demand', icon: 'link' as const },
  { id: 'git', label: 'Git repository', hint: 'kept in sync', icon: 'git-branch' as const },
  { id: 'direct', label: 'Direct API', hint: 'no contract', icon: 'zap' as const },
];

export default {
  title: 'Components/Tabs',
  component: Tabs,
  parameters: itemParams(['tabs'], 'WAI-ARIA tabs. Use them to switch views of one page, not to navigate between pages. The count is read with the label ("Operations, 4").'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition, props: {} })
};

/** `idPrefix` keeps tab and panel ids unique when two tab lists share a page. */
export const IdPrefix: StoryObj<typeof IdPrefixComposition> = {
  name: 'Two lists on a page (idPrefix)',
  render: () => ({ Component: IdPrefixComposition, props: {} })
};

export const ManualActivation: StoryObj<typeof ManualActivationComposition> = {
  name: 'Manual activation',
  parameters: { docs: { description: { story: 'Arrow keys only move focus; Enter or Space selects. Use it when a panel is expensive to load.' } } },
  render: () => ({ Component: ManualActivationComposition, props: {} })
};

export const WithDisabledTab: StoryObj<typeof WithDisabledTabComposition> = {
  name: 'Disabled tab',
  render: () => ({ Component: WithDisabledTabComposition, props: {} })
};

export const LiveAndAlert: StoryObj<typeof LiveAndAlertComposition> = {
  name: 'Live dot and warning count',
  parameters: { docs: { description: { story: 'A live dot before the label (read "Tasks, live") and a warning pill (read "Users, 2 pending changes").' } } },
  render: () => ({ Component: LiveAndAlertComposition, props: {} })
};

export const CardWithIcons: StoryObj<typeof CardWithIconsComposition> = {
  name: 'Card variant, icons and hints (Import)',
  render: () => ({ Component: CardWithIconsComposition, props: {} })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { label: 'Service sections', value: 'operations', activation: 'automatic', variant: 'line', idPrefix: 'pg', items: [{ id: 'operations', label: 'Operations', count: 8 }, { id: 'tests', label: 'Tests', alert: 1, alertLabel: 'failing' }, { id: 'contract', label: 'Contract' }] },
  argTypes: {
    activation: { control: 'inline-radio', options: ['automatic', 'manual'] },
    variant: { control: 'inline-radio', options: ['line', 'card'] },
    onchange: { table: { disable: true } },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
