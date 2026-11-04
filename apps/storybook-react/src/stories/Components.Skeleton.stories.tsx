import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Skeleton } from '@microcks-deep-ink/registry/react/skeleton';
import { itemParams } from './_meta';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: itemParams(['skeleton'], 'Placeholder lines, hidden from assistive technology. The container sets `aria-busy` and a status message says what loads. Static under reduced motion.'),
} satisfies Meta<typeof Skeleton>;

export const Default: StoryObj = {
  render: () => (
    <div aria-busy="true" style={{ maxWidth: 420 }}>
      <p className="sr-only" role="status">Loading services</p>
      <Skeleton lines={3} />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Skeleton> = {
  args: { lines: 3, width: '60%' },
};
