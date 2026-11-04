import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Stepper } from '@microcks/deep-ink';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/Stepper',
  component: Stepper,
  parameters: itemParams(['stepper'], 'Numbered steps in an ordered list. Progress marks the current step with aria-current="step" and writes "done" for done steps; list shows numbered instructions.'),
} satisfies Meta<typeof Stepper>;

export const Progress: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Stepper label="Progress" steps={[{ label: 'Source', state: 'current' }, { label: 'Preview' }, { label: 'Live mock' }]} />
      <Stepper label="Progress" steps={[{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }]} />
      <Stepper label="Progress" steps={[{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'done' }, { label: 'Live mock', state: 'done' }]} />
    </div>
  ),
};

/** `direction="vertical"` for a narrow column; `doneLabel` changes the word read for finished steps. */
export const Vertical: StoryObj = {
  render: () => (
    <Stepper
      label="Import steps"
      direction="vertical"
      doneLabel="completed"
      steps={[{ label: 'Upload the contract', state: 'done' }, { label: 'Review the operations', state: 'current' }, { label: 'Publish', state: 'upcoming' }]}
    />
  ),
};

export const Instructions: StoryObj = {
  render: () => (
    <div style={{ maxWidth: 360 }}>
      <Stepper
        label="Before you paste"
        variant="list"
        steps={[
          { label: 'Add MICROCKS_URL and the service account secret to the repository settings.' },
          { label: 'Paste the job in .github/workflows/contract-tests.yml and push.' },
        ]}
      />
    </div>
  ),
};

export const CircledPlan: StoryObj = {
  name: 'List with circled numbers (WorkflowRun plan)',
  render: () => (
    <section aria-labelledby="stepper-plan" style={{ maxWidth: 420 }}>
      <h3 id="stepper-plan" className="section-label">Plan</h3>
      <Stepper
        variant="list"
        marker="circle"
        steps={[
          { label: <><span className="sr-only">Step 1: </span><span style={{ font: '600 13px/1.3 var(--font-mono)' }}>checkMenu</span><span style={{ font: '400 11px/1.4 var(--font-mono)', color: 'var(--text-muted)' }}>GET /pastries</span></> },
          { label: <><span className="sr-only">Step 2: </span><span style={{ font: '600 13px/1.3 var(--font-mono)' }}>orderPastry</span><span style={{ font: '400 11px/1.4 var(--font-mono)', color: 'var(--text-muted)' }}>POST /orders</span></> },
        ]}
      />
    </section>
  ),
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
