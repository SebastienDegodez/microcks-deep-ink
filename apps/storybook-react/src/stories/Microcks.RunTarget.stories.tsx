import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RunTarget } from '@microcks-deep-ink/registry/react/run-target';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/RunTarget',
  parameters: itemParams(['run-target', 'chip'], 'What a workflow run calls. "Mixed" is a proposal beyond the POC and says so in text, with a dashed chip.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="di-inline">
      <RunTarget target="mocks" />
      <RunTarget target="implementations" />
      <RunTarget target="mixed" />
    </div>
  ),
};
