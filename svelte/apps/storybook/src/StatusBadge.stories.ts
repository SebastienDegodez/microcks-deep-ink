import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { StatusBadge } from '@microcks/deep-ink';

const meta = {
  title: 'Presentational/StatusBadge',
  component: StatusBadge,
  args: { status: 'conformant', size: 'md', shape: 'circled' },
  argTypes: {
    status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] },
    size: { control: 'select', options: ['md', 'sm', 'lg'] },
    shape: { control: 'select', options: ['circled', 'bare'] },
    children: { control: false },
  },
} satisfies Meta<typeof StatusBadge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Conformant: Story = {};
export const Failed: Story = { args: { status: 'failed' } };
export const Partial: Story = { args: { status: 'partial' } };
export const Running: Story = { args: { status: 'running' } };
export const NeverTested: Story = { args: { status: 'never' } };
export const Bare: Story = { args: { shape: 'bare', status: 'failed' } };
export const SmallCircled: Story = { args: { size: 'sm' } };
export const SmallBare: Story = { args: { size: 'sm', shape: 'bare' } };
export const Large: Story = { args: { size: 'lg', status: 'running' } };
export const RichContext: Story = {
  args: {
    size: 'lg', shape: 'bare', status: 'running', label: 'Retrying',
    children: createRawSnippet(() => ({ render: () => '<span> · attempt <strong>2</strong> of 3</span>' })),
  },
};
export const EmptyLabelFallback: Story = { args: { label: '  ', status: 'never' } };
