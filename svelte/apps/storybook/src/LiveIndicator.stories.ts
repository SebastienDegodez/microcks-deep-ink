import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { LiveIndicator } from '@microcks/deep-ink';

const meta = {
  title: 'Presentational/LiveIndicator',
  component: LiveIndicator,
  args: { label: 'live', size: 'md', variant: 'pill', pulse: true, paused: false },
  argTypes: {
    variant: { control: 'select', options: ['pill', 'inline', 'box', 'dot'] },
    size: { control: 'select', options: ['md', 'sm', 'compact', 'lg'] },
  },
} satisfies Meta<typeof LiveIndicator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Pill: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const Compact: Story = { args: { size: 'compact' } };
export const StaticCompact: Story = { args: { size: 'compact', pulse: false } };
export const Inline: Story = { args: { variant: 'inline' } };
export const Box: Story = { args: { variant: 'box', label: 'live · installing 3 APIs' } };
export const LargeBox: Story = { args: { variant: 'box', size: 'lg', label: 'live · fetching and importing artifacts' } };
export const Dot: Story = { args: { variant: 'dot' } };
export const Paused: Story = { args: { paused: true } };
export const PausedDot: Story = { args: { paused: true, variant: 'dot' } };
export const PausedWithCount: Story = { args: { paused: true, pausedLabel: 'paused · 2 new calls' } };
