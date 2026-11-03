import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { LiveIndicator } from '@microcks-deep-ink/registry/react/live-indicator';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/LiveIndicator',
  parameters: itemParams(['live-indicator'], 'Marks a real-time stream only. It is not a status and not a live region: pair it with a Pause control (RGAA 13.8) and announce stream changes elsewhere. The dot is static under reduced motion.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => <LiveIndicator />,
};

export const Paused: StoryObj = {
  render: () => <LiveIndicator paused />,
};

export const CustomLabel: StoryObj = {
  name: 'Custom label',
  render: () => <LiveIndicator label="recording" />,
};
