import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { createRawSnippet } from 'svelte';
import { Button } from '@microcks/deep-ink';
import ButtonComposition from './ButtonComposition.svelte';

const meta = {
  title: 'Actions/Button',
  component: Button,
  args: { children: createRawSnippet(() => ({ render: () => '<span>Save changes</span>' })), variant: 'secondary', size: 'md' },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'select', options: ['xs', 'sm', 'compact', 'tile', 'md', 'lg'] },
    tone: { control: 'select', options: [undefined, 'danger', 'link'] },
    children: { control: false }, element: { control: false },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {};
export const Primary: Story = { args: { variant: 'primary' } };
export const Outline: Story = { args: { variant: 'outline' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Link: Story = { args: { variant: 'link' } };
export const Dashed: Story = { args: { variant: 'dashed', icon: 'plus' } };
export const Danger: Story = { args: { variant: 'danger' } };
export const ConfirmDanger: Story = { args: { variant: 'danger', confirm: true } };
export const DangerTone: Story = { args: { variant: 'ghost', tone: 'danger', icon: 'trash' } };
export const Undo: Story = { args: { variant: 'outline', tone: 'link', size: 'xs', icon: 'undo' } };
export const ExtraSmall: Story = { args: { size: 'xs' } };
export const Small: Story = { args: { size: 'sm' } };
export const Compact: Story = { args: { size: 'compact' } };
export const Tile: Story = { args: { size: 'tile' } };
export const Large: Story = { args: { size: 'lg', variant: 'primary' } };
export const LeadingIcon: Story = { args: { icon: 'copy' } };
export const IconOnly: Story = { args: { icon: 'plus', iconOnly: true, children: undefined, 'aria-label': 'Add API' } };
export const Pressed: Story = { args: { 'aria-pressed': true } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true, icon: 'upload' } };
export const NativeFormAndSnippets: Story = { render: (args) => ({ Component: ButtonComposition, props: args }) };
