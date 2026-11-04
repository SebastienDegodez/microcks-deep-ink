import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Menu } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Components/Menu',
  component: Menu,
  parameters: itemParams(['menu', 'button'], 'A disclosure menu on the native `popover` attribute: the trigger is a button with `aria-expanded`, Escape and click outside close it natively. It is not an ARIA `role="menu"` application menu.'),
} satisfies Meta<typeof Menu>;

export const Default: StoryObj = {
  render: () => (
    <Menu
      label="Actions"
      items={[
        { id: 'run', label: 'Run test', onSelect: () => undefined },
        { id: 'export', label: 'Export contract', onSelect: () => undefined },
        { id: 'docs', label: 'Open docs', href: '#docs' },
        { id: 'delete', label: 'Delete service', danger: true, onSelect: () => undefined },
      ]}
    />
  ),
};

/** `align="end"` opens the list towards the start of the page, for a menu at the right edge. */
export const AlignEnd: StoryObj = {
  name: 'Aligned to the end',
  render: () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', minHeight: 180 }}>
      <Menu label="Actions" align="end" items={[{ id: 'edit', label: 'Edit' }, { id: 'delete', label: 'Delete', danger: true, separatorBefore: true }]} />
    </div>
  ),
};

export const IconOnly: StoryObj = {
  name: 'Icon only',
  render: () => (
    <Menu label="More actions" icon="more" iconOnly variant="ghost" size="sm" items={[{ id: 'a', label: 'Duplicate' }, { id: 'b', label: 'Archive', disabled: true }]} />
  ),
};

export const SeparatorAndDescription: StoryObj = {
  name: 'Separator and description',
  render: () => (
    <Menu
      label="More actions"
      icon="more-vertical"
      iconOnly
      items={[
        { id: 'copy', label: 'Copy workflowId' },
        { id: 'dl', label: 'Download Arazzo document' },
        { id: 'del', label: 'Delete workflow', danger: true, disabled: true, separatorBefore: true, description: 'Workflows are removed with their Arazzo document.' },
      ]}
    />
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Menu> = {
  args: {
    label: 'Actions', iconOnly: false, variant: 'secondary', size: 'md', align: 'start',
    items: [
      { id: 'edit', label: 'Edit', description: 'Change the service metadata.' },
      { id: 'export', label: 'Export' },
      { id: 'delete', label: 'Delete', danger: true, separatorBefore: true },
    ],
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'link', 'dashed', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'compact', 'tile', 'md', 'lg'] },
    align: { control: 'inline-radio', options: ['start', 'end'] },
  },
  decorators: [(Story) => <div style={{ minHeight: 200 }}><Story /></div>],
};
