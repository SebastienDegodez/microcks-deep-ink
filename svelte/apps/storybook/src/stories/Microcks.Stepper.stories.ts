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
  render: () => ({ Component: ProgressExample, props: {} }),
};

/** `direction="vertical"` for a narrow column; `doneLabel` changes the word read for finished steps. */
export const Vertical: StoryObj = {
  render: () => ({ Component: VerticalExample, props: {} }),
};

export const Instructions: StoryObj = {
  render: () => ({ Component: InstructionsExample, props: {} }),
};

export const CircledPlan: StoryObj = {
  name: 'List with circled numbers (WorkflowRun plan)',
  render: () => ({ Component: CircledPlanExample, props: {} }),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof Stepper> = {
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
