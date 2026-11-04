import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RunTarget } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunTarget',
  component: RunTarget,
  parameters: itemParams(['run-target', 'chip'], 'What a workflow run calls. "Mixed" is a proposal beyond the POC and says so in text, with a dashed chip.'),
} satisfies Meta<typeof RunTarget>;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <RunTarget target="mocks" />
      <RunTarget target="implementations" />
      <RunTarget target="mixed" />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof RunTarget> = {
  args: { target: 'mocks' },
  argTypes: { target: { control: 'inline-radio', options: ['mocks', 'implementations', 'mixed'] } },
};
