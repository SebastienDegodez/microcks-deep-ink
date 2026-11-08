import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { FilterBar } from '@microcks/deep-ink';
import FilterBarStory from './Microcks.FilterBar.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/FilterBar', component: FilterBar, parameters: itemParams(['filter-bar','chip','segmented'], 'A named box of filter rows: a search field, titled rows of chips or segmented controls, and a Reset that writes the number of active filters.') } satisfies Meta<typeof FilterBar>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Catalogue = story({ render: (() => ({ Component: FilterBarStory, props: { variant: 'Catalogue' } })) as never });
/** `FilterReset` takes a `label` and shows the number of active filters. */
export const ResetLabel = story({ name: 'Reset button label', render: (() => ({ Component: FilterBarStory, props: { variant: 'ResetLabel' } })) as never });
export const PageSearch = story({ name: 'Page search and category pills (Hub)', render: (() => ({ Component: FilterBarStory, props: { variant: 'PageSearch' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { label: 'Filter services' }, render: ((args: Record<string, unknown>) => ({ Component: FilterBarStory, props: { variant: 'Playground', ...args } })) as never, argTypes: { children: { control: false } } });
