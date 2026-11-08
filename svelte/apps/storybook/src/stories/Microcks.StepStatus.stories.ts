import ChecksExample from './Microcks.StepStatus/Checks.svelte';
import DefaultExample from './Microcks.StepStatus/Default.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { StepChecks, StepStatus } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StepStatus',
  component: StepStatus,
  parameters: itemParams(['step-status', 'icon'], 'Outcome of an Arazzo step: "✓ Passed", "✕ Failed · 3 attempts", "– Not run". Not run is muted text on a dashed outline, never reduced opacity. `StepChecks` lists the two checks the POC evaluates: **Success criteria** and **Schema validation**.'),
} satisfies Meta<typeof StepStatus>;

export const Default: StoryObj = {
  render: () => ({ Component: DefaultExample }),
};

export const Checks: StoryObj = {
  render: () => ({ Component: ChecksExample }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StepStatus> = {
  args: { status: 'failed', attempts: 2 },
  argTypes: { status: { control: 'inline-radio', options: ['passed', 'failed', 'not-run'] } },
};
