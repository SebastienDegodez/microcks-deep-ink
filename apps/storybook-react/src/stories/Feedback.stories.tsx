import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { MkLiveIndicator, MkStatusBadge } from '@microcks-deep-ink/react';

const meta: Meta<typeof MkStatusBadge> = {
  title: 'Feedback/StatusBadge',
  component: MkStatusBadge,
  args: { status: 'conformant' },
  argTypes: { status: { control: 'select', options: ['conformant', 'failed', 'partial', 'running', 'never'] } },
  parameters: { docs: { description: { component: 'An outcome is always **icon + word + color**, never color alone.' } } },
};
export default meta;

export const Playground: StoryObj<typeof MkStatusBadge> = {};

export const AllOutcomes: StoryObj<typeof MkStatusBadge> = {
  render: () => (
    <div className="di-stack">
      <MkStatusBadge status="conformant" />
      <MkStatusBadge status="failed" />
      <MkStatusBadge status="partial" />
      <MkStatusBadge status="running" />
      <MkStatusBadge status="never" />
    </div>
  ),
};

export const Live: StoryObj<typeof MkLiveIndicator> = {
  render: () => (
    <div className="di-col">
      <div className="di-stack">
        <MkLiveIndicator />
        <MkLiveIndicator label="streaming test" />
      </div>
      <p className="di-note">
        The pink rule: <code>live</code> is the logo&apos;s baseline pink. It marks real-time activity only and is never a status. Failures use coral
        <code> danger</code> with a ✕ icon.
      </p>
    </div>
  ),
};
