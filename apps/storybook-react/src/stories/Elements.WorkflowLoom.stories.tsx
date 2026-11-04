import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { WorkflowLoom } from '@microcks-deep-ink/registry/react/workflow-loom';
import { LOOM_CHECK_MENU, LOOM_RESTOCK_RUN14, LOOM_SESSION_RUN13, type LoomScenario } from '@microcks-deep-ink/storybook-shared/fixtures';
import { detailOf, itemParams } from './_meta';

export default {
  title: 'Elements/WorkflowLoom',
  component: WorkflowLoom,
  parameters: itemParams(['workflow-loom', 'step-status'], 'Draws an Arazzo workflow: one lane per source, steps placed by `dependsOn` depth, threads for data, and only two action kinds, **retry** and **end** (no goto). Steps are buttons you move between with the arrow keys; **Show as table** swaps the drawing for an equivalent table. `<workflow-loom>` is a Web Component: the item copies a self-contained bundle plus a thin wrapper.', { layout: 'padded' }),
} satisfies Meta<typeof WorkflowLoom>;

function Loom({ scenario, selected, tableToggle }: { scenario: LoomScenario; selected?: string; tableToggle?: boolean }) {
  const [step, setStep] = useState<string | undefined>(selected);
  const [lens, setLens] = useState<string | undefined>();
  return (
    <div className="sb-col">
      <WorkflowLoom
        {...scenario}
        tableToggle={tableToggle}
        selectedStep={step}
        lens={lens}
        onStepSelect={(e: unknown) => setStep(detailOf<{ stepId?: string }>(e).stepId)}
        onLensSelect={(e: unknown) => setLens(detailOf<{ id?: string }>(e).id)}
      />
      <p className="sb-note" role="status">
        {step ? `Selected step: ${step}` : 'No step selected. Focus a step and press Enter or Space.'}
        {lens ? ` Lens: ${lens}.` : ' Press an input, an output or a thread label to trace it.'}
      </p>
    </div>
  );
}

/** Run #14 of restock-pastry: patchPastry fails Schema validation (price is the string "3.9"); verifyPastry did not run. */
export const Default: StoryObj = {
  name: 'Run #14 (restock-pastry)',
  render: () => <Loom scenario={LOOM_RESTOCK_RUN14} selected="patchPastry" />,
};

/** A session run: each node lists generic checks (`checks: { label, state }[]`): Call #N, Data passing, Contract. */
export const SessionChecks: StoryObj = {
  name: 'Session run #13 (generic checks)',
  render: () => <Loom scenario={LOOM_SESSION_RUN13} selected="patchPastry" />,
};

/** On a page that already has a Steps tab, `tableToggle={false}` hides the built-in "Show as table" button. */
export const WithoutTableToggle: StoryObj = {
  name: 'Without the table toggle',
  render: () => <Loom scenario={LOOM_RESTOCK_RUN14} selected="patchPastry" tableToggle={false} />,
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
        outputNote: undefined,
        inputs: LOOM_RESTOCK_RUN14.inputs?.map((i) => (typeof i === 'string' ? i : { name: i.name })),
        threads: LOOM_RESTOCK_RUN14.threads.map(({ value: _v, missing: _m, drops, ...t }) => ({ ...t, drops: drops?.map(({ idle: _i, ...d }) => d) })),
        steps: LOOM_RESTOCK_RUN14.steps.map(({ status: _s, attempts: _a, checks: _c, result: _r, actions, ...step }) => ({
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

/** Interactive: every prop of the component is a control in the Controls panel. */
export const Playground: StoryObj<typeof WorkflowLoom> = {
  args: { ...LOOM_RESTOCK_RUN14, selectedStep: 'patchPastry', tableToggle: true },
};

/** Same scenario as the Angular `Run14` story. */
export const Run14: StoryObj = {
  name: 'Run #14 (retry and failed step)',
  render: () => <Loom scenario={LOOM_RESTOCK_RUN14} selected="patchPastry" />,
};
