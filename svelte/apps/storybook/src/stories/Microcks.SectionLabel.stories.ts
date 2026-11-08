import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { SectionLabel } from '@microcks/deep-ink';
import SectionLabelStory from './Microcks.SectionLabel.svelte';
import { itemParams } from './_meta';
const meta = { title: 'Microcks/SectionLabel', component: SectionLabel, parameters: itemParams(['section-label'], 'A small uppercase muted label. Use a heading for a section, a label for a field, a span for a caption. The text stays in normal case in the DOM.') } satisfies Meta<typeof SectionLabel>;
export default meta; type Story = StoryObj<typeof meta>;
const story = (entry: unknown): Story => entry as Story;
export const Uses = story({ render: (() => ({ Component: SectionLabelStory, props: { variant: 'Uses' } })) as never });
/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground = story({ args: { children: createRawSnippet(() => ({ render: () => 'Operations' })), as: 'h3', size: 'md', weight: 'semibold', split: false, lineHeight: 'fixed' }, argTypes: { as: { control: 'select', options: ['h2','h3','h4','h5','h6','label','span','p','div'] }, size: { control: 'inline-radio', options: ['md','sm'] }, weight: { control: 'inline-radio', options: ['semibold','regular'] }, lineHeight: { control: 'inline-radio', options: ['fixed','normal','snug'] }, children: { control: false } } });
