import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { StatusBadge } from '@microcks-deep-ink/registry/react/status-badge';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StatusBadge',
  parameters: itemParams(['status-badge', 'icon'], 'An icon and a word, always. The icon shapes differ (check, cross, triangle, arc, circle), so the status is readable without color.'),
} satisfies Meta;

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
