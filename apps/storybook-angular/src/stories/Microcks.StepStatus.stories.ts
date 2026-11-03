import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { StepStatusComponent, StepChecksComponent } from '@microcks-deep-ink/registry/angular/step-status';
import { itemParams } from './_meta';

const meta: Meta = {
  title: 'Microcks/StepStatus',
  decorators: [moduleMetadata({ imports: [StepStatusComponent, StepChecksComponent] })],
  parameters: itemParams(['step-status', 'icon'], "Outcome of an Arazzo step: \"\u2713 Passed\", \"\u2715 Failed \u00b7 3 attempts\", \"\u2013 Not run\". Not run is muted text on a dashed outline, never reduced opacity. `StepChecks` lists the two checks the POC evaluates: **Success criteria** and **Schema validation**."),
};
export default meta;

export const Default: StoryObj = {
  render: () => ({
    template: `
      <div class="di-inline">
        <span mkStepStatus status="passed"></span>
        <span mkStepStatus status="failed" [attempts]="3"></span>
        <span mkStepStatus status="not-run"></span>
      </div>
    `,
  }),
};

export const Checks: StoryObj = {
  render: () => ({
    template: `
      <div class="sb-col">
        <div class="sb-cell">
          <span class="sb-caption">patchPastry (run #14)</span>
          <ul mkStepChecks successCriteria="passed" schemaValidation="failed"></ul>
        </div>
        <div class="sb-cell">
          <span class="sb-caption">verifyPastry (not run)</span>
          <ul mkStepChecks successCriteria="not-evaluated" schemaValidation="not-evaluated"></ul>
        </div>
        <div class="sb-cell">
          <span class="sb-caption">Schema validation switched off</span>
          <ul mkStepChecks successCriteria="passed" schemaValidation="off"></ul>
        </div>
      </div>
    `,
  }),
};
