import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Menu } from '@microcks-deep-ink/registry/react/menu';
import { itemParams } from './_meta';

export default {
  title: 'Components/Menu',
  parameters: itemParams(['menu', 'button'], 'A disclosure menu on the native `popover` attribute: the trigger is a button with `aria-expanded`, Escape and click outside close it natively. It is not an ARIA `role="menu"` application menu.'),
} satisfies Meta;

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
