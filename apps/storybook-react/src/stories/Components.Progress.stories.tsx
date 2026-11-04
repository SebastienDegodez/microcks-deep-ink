import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Meter, Progress } from '@microcks-deep-ink/registry/react/progress';
import { itemParams } from './_meta';

export default {
  title: 'Components/Progress',
  component: Progress,
  parameters: itemParams(['progress'], 'Native `<progress>` and `<meter>`, each with a visible label. Without a value the progress is indeterminate.'),
} satisfies Meta<typeof Progress>;

export const Default: StoryObj = {
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <Progress label="Importing contract" value={65} />
      <Progress label="Waiting for the broker" />
    </div>
  ),
};

/** `Progress.max` for a count, and `Meter.min` for a range that does not start at zero. */
export const CustomRange: StoryObj = {
  name: 'Custom range',
  render: () => (
    <div className="sb-col" style={{ maxWidth: 420 }}>
      <Progress label="Operations tested" value={8} max={12} />
      <Meter label="Latency" value={140} min={50} max={500} low={200} high={350} optimum={80} valueText="140 ms" />
    </div>
  ),
};

export const MeterStory: StoryObj = {
  name: 'Meter',
  render: () => (
    <div className="stack" style={{ maxWidth: 420 }}>
      <Meter label="Operations passing" value={11} max={12} low={8} high={11} optimum={12} valueText="11 of 12" />
      <Meter label="Operations passing" value={5} max={12} low={8} high={11} optimum={12} valueText="5 of 12" />
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Progress> = {
  args: { label: 'Importing operations', value: 60, max: 100 },
};
