import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { ButtonLink } from '@microcks/deep-ink';

const meta = {
  title: 'Actions/ButtonLink', component: ButtonLink,
  args: { href: '#destination', children: createRawSnippet(() => ({ render: () => '<span>View details</span>' })) },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'compact', 'tile', 'md', 'lg'] },
    children: { control: false }, element: { control: false },
  },
} satisfies Meta<typeof ButtonLink>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Navigation: Story = {};
export const External: Story = { args: { href: 'https://microcks.io', target: '_blank', rel: 'noopener noreferrer', icon: 'external' } };
export const OutlineLinkTone: Story = { args: { variant: 'outline', tone: 'link', size: 'xs', icon: 'undo' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const IconOnly: Story = { args: { icon: 'external', iconOnly: true, children: undefined, 'aria-label': 'Open details' } };
