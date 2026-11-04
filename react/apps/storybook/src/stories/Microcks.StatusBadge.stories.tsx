import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { StatusBadge } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StatusBadge',
  component: StatusBadge,
  parameters: itemParams(['status-badge', 'icon'], 'An icon and a word, always. The icon shapes differ (check, cross, triangle, arc, circle), so the status is readable without color.'),
} satisfies Meta<typeof StatusBadge>;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <StatusBadge status="conformant" />
      <StatusBadge status="failed" />
      <StatusBadge status="partial" />
      <StatusBadge status="running" />
      <StatusBadge status="never" />
    </div>
  ),
};

export const Small: StoryObj = {
  render: () => (
    <div className="inline">
      <StatusBadge size="sm" status="conformant" label="92 % conformant" />
      <StatusBadge size="sm" status="failed" label="2 failed" />
    </div>
  ),
};

export const Bare: StoryObj = {
  name: 'Bare (step outcomes)',
  render: () => (
    <div className="inline">
      <StatusBadge shape="bare" status="conformant" label="Passed" />
      <StatusBadge shape="bare" status="failed" />
      <StatusBadge shape="bare" status="running" />
      <StatusBadge shape="bare" status="never" label="Pending" />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StatusBadge> = {
  args: { status: 'conformant', size: 'md', shape: 'circled' },
  argTypes: {
    status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    shape: { control: 'inline-radio', options: ['circled', 'bare'] },
  },
};
