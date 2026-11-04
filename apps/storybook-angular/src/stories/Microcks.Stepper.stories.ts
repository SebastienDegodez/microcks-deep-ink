import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { StepperComponent } from '@microcks-deep-ink/registry/angular/stepper';
import { argTypesFor, itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/Stepper',
  argTypes: argTypesFor('stepper', ['StepperComponent']),
  decorators: [moduleMetadata({ imports: [StepperComponent] })],
  parameters: itemParams(['stepper'], 'Numbered steps in an ordered list. Progress marks the current step with aria-current="step" and writes "done" for done steps; list shows numbered instructions.'),
};
export default meta;

export const Progress: StoryObj = {
  render: () => ({
    props: {
      start: [{ label: 'Source', state: 'current' }, { label: 'Preview' }, { label: 'Live mock' }],
      middle: [{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'current' }, { label: 'Live mock' }],
      end: [{ label: 'Source', state: 'done' }, { label: 'Preview', state: 'done' }, { label: 'Live mock', state: 'done' }],
    },
    template: `<div style="display: flex; flex-direction: column; gap: 20px"><ol mkStepper label="Progress" [steps]="start"></ol><ol mkStepper label="Progress" [steps]="middle"></ol><ol mkStepper label="Progress" [steps]="end"></ol></div>`,
  }),
};

/** `direction="vertical"` for a narrow column; `doneLabel` changes the word read for finished steps. */
export const Vertical: StoryObj = {
  render: () => ({
    props: { steps: [{ label: 'Upload the contract', state: 'done' }, { label: 'Review the operations', state: 'current' }, { label: 'Publish', state: 'upcoming' }] },
    template: `<ol mkStepper label="Import steps" direction="vertical" doneLabel="completed" [steps]="steps"></ol>`,
  }),
};

export const Instructions: StoryObj = {
  render: () => ({
    props: {
      steps: [
        { label: 'Add MICROCKS_URL and the service account secret to the repository settings.' },
        { label: 'Paste the job in .github/workflows/contract-tests.yml and push.' },
      ],
    },
    template: `<div style="max-width: 360px"><ol mkStepper label="Before you paste" variant="list" [steps]="steps"></ol></div>`,
  }),
};

export const CircledPlan: StoryObj = {
  name: 'List with circled numbers (WorkflowRun plan)',
  render: () => ({
    props: { steps: [{ label: 'checkMenu · GET /pastries' }, { label: 'orderPastry · POST /orders' }] },
    template: `<section aria-labelledby="stepper-plan" style="max-width: 420px"><h3 id="stepper-plan" class="section-label">Plan</h3><ol mkStepper variant="list" marker="circle" [steps]="steps"></ol></section>`,
  }),
};
