import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { WorkflowLoom } from '@microcks-deep-ink/registry/react/workflow-loom';
import { LOOM_CHECK_MENU, LOOM_RESTOCK_RUN14, type LoomScenario } from '@microcks-deep-ink/storybook-shared/fixtures';
import { detailOf, itemParams } from './_meta';

export default {
  title: 'Elements/WorkflowLoom',
  parameters: itemParams(['workflow-loom', 'step-status'], 'Draws an Arazzo workflow: one lane per source, steps placed by `dependsOn` depth, threads for data, and only two action kinds, **retry** and **end** (no goto). Steps are buttons you move between with the arrow keys; **Show as table** swaps the drawing for an equivalent table. `<workflow-loom>` is a Web Component: the item copies a self-contained bundle plus a thin wrapper.', { layout: 'padded' }),
} satisfies Meta;

function Loom({ scenario, selected }: { scenario: LoomScenario; selected?: string }) {
  const [step, setStep] = useState<string | undefined>(selected);
  return (
    <div className="sb-col">
      <WorkflowLoom {...scenario} selectedStep={step} onStepSelect={(e: unknown) => setStep(detailOf<{ stepId: string }>(e).stepId)} />
      <p className="sb-note" role="status">
        {step ? `Selected step: ${step}` : 'No step selected. Focus a step and press Enter or Space.'}
      </p>
    </div>
  );
}

/** Run #14 of restock-pastry: patchPastry fails Schema validation (price is the string "3.9"); verifyPastry did not run. */
export const Default: StoryObj = {
  name: 'Run #14 (restock-pastry)',
  render: () => <Loom scenario={LOOM_RESTOCK_RUN14} selected="patchPastry" />,
};

/** Three independent reads run in parallel (dependsOn) and join at compareSizes. */
export const CheckMenu: StoryObj = {
  name: 'Parallel branches (check-menu)',
  render: () => <Loom scenario={LOOM_CHECK_MENU} />,
};

/** A design-time view: no run, so no statuses and no checks. */
export const DesignTime: StoryObj = {
  name: 'Design time (no run)',
  render: () => (
    <Loom
      scenario={{
        ...LOOM_RESTOCK_RUN14,
        label: 'restock-pastry, definition',
        validatesSchemas: false,
        steps: LOOM_RESTOCK_RUN14.steps.map(({ status: _s, attempts: _a, checks: _c, actions, ...step }) => ({
          ...step,
          actions: actions?.map((a: NonNullable<LoomScenario['steps'][number]['actions']>[number]) => (a.type === 'retry' ? { ...a, applied: undefined } : { ...a, taken: undefined })),
        })),
      }}
    />
  ),
};

export const NotLinked: StoryObj = {
  name: 'Source not linked',
  render: () => (
    <Loom
      scenario={{
        ...LOOM_CHECK_MENU,
        label: 'check-menu, bakeryApi not linked',
        sources: LOOM_CHECK_MENU.sources.map((s) => (s.name === 'bakeryApi' ? { ...s, linked: false } : s)),
      }}
    />
  ),
};
