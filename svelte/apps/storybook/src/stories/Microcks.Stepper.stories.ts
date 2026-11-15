import exampleSource0 from './Microcks.Stepper/Progress.svelte?raw';
import exampleSource1 from './Microcks.Stepper/Vertical.svelte?raw';
import exampleSource2 from './Microcks.Stepper/Instructions.svelte?raw';
import exampleSource3 from './Microcks.Stepper/CircledPlan.svelte?raw';
import CircledPlanExample from './Microcks.Stepper/CircledPlan.svelte';
import InstructionsExample from './Microcks.Stepper/Instructions.svelte';
import VerticalExample from './Microcks.Stepper/Vertical.svelte';
import ProgressExample from './Microcks.Stepper/Progress.svelte';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { Stepper } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/Stepper',
  component: Stepper,
  parameters: itemParams(['stepper'], 'Numbered steps in an ordered list. Progress marks the current step with aria-current="step" and writes "done" for done steps; list shows numbered instructions.'),
} satisfies Meta<typeof Stepper>;

export const Progress: StoryObj = {
  parameters: { docs: { source: { code: exampleSource0, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: ProgressExample, props: {} }),
};

/** `direction="vertical"` for a narrow column; `doneLabel` changes the word read for finished steps. */
export const Vertical: StoryObj = {
  parameters: { docs: { source: { code: exampleSource1, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: VerticalExample, props: {} }),
};

export const Instructions: StoryObj = {
  parameters: { docs: { source: { code: exampleSource2, language: 'svelte', type: 'code' } } },
  render: () => ({ Component: InstructionsExample, props: {} }),
};

export const CircledPlan: StoryObj = {
  parameters: { docs: { source: { code: exampleSource3, language: 'svelte', type: 'code' } } },
  name: 'List with circled numbers (WorkflowRun plan)',
  render: () => ({ Component: CircledPlanExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Stepper> = {
  parameters: { docs: { source: { code: `<script>
  import { Stepper } from '@microcks/deep-ink';
</script>

<Stepper label="Import steps" variant="progress" direction="horizontal" doneLabel="done" marker="number" steps={[{"label":"Upload","state":"done"},{"label":"Review","state":"current"},{"label":"Publish","state":"upcoming"}]} />`, language: 'svelte', type: 'code' } } },
  args: {
    label: 'Import steps', variant: 'progress', direction: 'horizontal', doneLabel: 'done', marker: 'number',
    steps: [{ label: 'Upload', state: 'done' }, { label: 'Review', state: 'current' }, { label: 'Publish', state: 'upcoming' }],
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['progress', 'list'] },
    direction: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    marker: { control: 'inline-radio', options: ['number', 'circle'] },
  },
};
