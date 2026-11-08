import DefaultComposition from './Components.EmptyState/Default.svelte';
import AlignStartComposition from './Components.EmptyState/AlignStart.svelte';
import NoResultsComposition from './Components.EmptyState/NoResults.svelte';
import PlaygroundComposition from './Components.EmptyState/Playground.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { Button } from '@microcks/deep-ink';
import { EmptyState } from '@microcks/deep-ink';
import { itemParams } from './_meta';


export default {
  title: 'Components/EmptyState',
  component: EmptyState,
  parameters: itemParams(['empty-state', 'button'], 'Says what is missing and offers the next step. The title is a heading: choose its level with `headingLevel`.'),
} satisfies Meta;

export const Default: StoryObj<typeof DefaultComposition> = {
  render: () => ({ Component: DefaultComposition })
};

/** `align="start"` for an empty panel inside a page; `headingLevel` follows the page outline. */
export const AlignStart: StoryObj<typeof AlignStartComposition> = {
  name: 'Aligned to the start',
  render: () => ({ Component: AlignStartComposition })
};

export const NoResults: StoryObj<typeof NoResultsComposition> = {
  name: 'No results (icon)',
  render: () => ({ Component: NoResultsComposition })
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof PlaygroundComposition> = {
  args: { title: 'No services yet', headingLevel: 2, icon: 'search-x', align: 'center', children: 'Import a contract to create your first service.' },
  argTypes: {
    align: { control: 'inline-radio', options: ['center', 'start'] },
    headingLevel: { control: 'inline-radio', options: [1, 2, 3, 4, 5, 6] },
  },
  render: (args) => ({ Component: PlaygroundComposition, props: args })
};
