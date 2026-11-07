import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { SummaryStripSep } from '@microcks/deep-ink';
import SeparatorComposition from './SeparatorComposition.svelte';

const meta = {
  title: 'Presentational/SummaryStripSep',
  component: SummaryStripSep,
} satisfies Meta<typeof SummaryStripSep>;
export default meta;
type Story = StoryObj<typeof meta>;

export const InStrip: Story = { render: (args) => ({ Component: SeparatorComposition, props: args }) };
