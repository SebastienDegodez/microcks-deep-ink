import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Meter, Progress } from '@microcks-deep-ink/registry/react/progress';
import { itemParams } from './_meta';

export default {
  title: 'Components/Progress',
  parameters: itemParams(['progress'], 'Native `<progress>` and `<meter>`, each with a visible label. Without a value the progress is indeterminate.'),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => (
    <div className="di-stack" style={{ maxWidth: 420 }}>
      <Progress label="Importing contract" value={65} />
      <Progress label="Waiting for the broker" />
    </div>
  ),
};

export const MeterStory: StoryObj = {
  name: 'Meter',
  render: () => (
    <div className="di-stack" style={{ maxWidth: 420 }}>
      <Meter label="Operations passing" value={11} max={12} low={8} high={11} optimum={12} valueText="11 of 12" />
      <Meter label="Operations passing" value={5} max={12} low={8} high={11} optimum={12} valueText="5 of 12" />
    </div>
  ),
};
