import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { StepChecks, StepStatus } from '@microcks-deep-ink/registry/react/step-status';
import { itemParams } from './_meta';

export default {
  title: 'Microcks/StepStatus',
  component: StepStatus,
  parameters: itemParams(['step-status', 'icon'], 'Outcome of an Arazzo step: "✓ Passed", "✕ Failed · 3 attempts", "– Not run". Not run is muted text on a dashed outline, never reduced opacity. `StepChecks` lists the two checks the POC evaluates: **Success criteria** and **Schema validation**.'),
} satisfies Meta<typeof StepStatus>;

export const Default: StoryObj = {
  render: () => (
    <div className="inline">
      <StepStatus status="passed" />
      <StepStatus status="failed" attempts={3} />
      <StepStatus status="not-run" />
    </div>
  ),
};

export const Checks: StoryObj = {
  render: () => (
    <div className="sb-col">
      <div className="sb-cell">
        <span className="sb-caption">patchPastry (run #14)</span>
        <StepChecks successCriteria="passed" schemaValidation="failed" />
      </div>
      <div className="sb-cell">
        <span className="sb-caption">verifyPastry (not run)</span>
        <StepChecks successCriteria="not-evaluated" schemaValidation="not-evaluated" />
      </div>
      <div className="sb-cell">
        <span className="sb-caption">Schema validation switched off</span>
        <StepChecks successCriteria="passed" schemaValidation="off" />
      </div>
    </div>
  ),
};

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof StepStatus> = {
  args: { status: 'failed', attempts: 2 },
  argTypes: { status: { control: 'inline-radio', options: ['passed', 'failed', 'not-run'] } },
};
