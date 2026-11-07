import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { SummaryStrip } from '@microcks/deep-ink';
import SummaryComposition from './SummaryComposition.svelte';

const meta = {
  title: 'Presentational/SummaryStrip',
  component: SummaryStrip,
  args: {
    parts: [{ text: 'Saved', kind: 'label' }, { text: '3 APIs', sep: true }, { text: 'every 5 minutes', sep: true }],
    role: 'note', 'aria-label': 'Schedule summary',
    variant: 'default', gap: 'normal', values: 'secondary', lineHeight: 'fixed',
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'canvas'] },
    gap: { control: 'select', options: ['normal', 'roomy'] },
    values: { control: 'select', options: ['secondary', 'text'] },
    lineHeight: { control: 'select', options: ['fixed', 'inherit'] },
    children: { control: false },
  },
} satisfies Meta<typeof SummaryStrip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Roomy: Story = { args: { gap: 'roomy', style: 'max-width: 240px' } };
export const TextValues: Story = { args: { values: 'text' } };
export const Canvas: Story = { args: { variant: 'canvas' } };
export const InheritLineHeight: Story = { args: { lineHeight: 'inherit', style: 'line-height: inherit' } };
export const RichPart: Story = {
  args: {
    parts: [{ text: createRawSnippet(() => ({ render: () => '<strong>3 APIs</strong>' })) }],
    children: createRawSnippet(() => ({ render: () => '<a href="#services">View services</a>' })),
  },
};
export const SnippetComposition: Story = { render: (args) => ({ Component: SummaryComposition, props: args }) };
