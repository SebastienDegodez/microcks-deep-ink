import exampleSource0 from './Microcks.StepStatus/Default.svelte?raw';
import exampleSource1 from './Microcks.StepStatus/Checks.svelte?raw';
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
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: DefaultExample, props: {} }),
};

export const Checks: StoryObj = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: ChecksExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StepStatus> = {
  parameters: { docs: { source: { code: `<script>
  import { StepStatus } from '@microcks/deep-ink';
</script>

<StepStatus status="failed" attempts={2} />`, language: 'svelte', type: 'code' } } },
  args: { status: 'failed', attempts: 2 },
  argTypes: { status: { control: 'inline-radio', options: ['passed', 'failed', 'not-run'] } },
};
