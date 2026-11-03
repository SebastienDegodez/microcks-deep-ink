import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { ApiBadge } from '@microcks-deep-ink/registry/react/api-badge';
import { Callout } from '@microcks-deep-ink/registry/react/callout';
import { CodeBlock } from '@microcks-deep-ink/registry/react/code-block';
import { DescriptionList } from '@microcks-deep-ink/registry/react/description-list';
import { Panel } from '@microcks-deep-ink/registry/react/panel';
import { RunOrigin } from '@microcks-deep-ink/registry/react/run-origin';
import { RunTarget } from '@microcks-deep-ink/registry/react/run-target';
import { StatusBadge } from '@microcks-deep-ink/registry/react/status-badge';
import { StepChecks, StepStatus } from '@microcks-deep-ink/registry/react/step-status';
import { WorkflowLoom } from '@microcks-deep-ink/registry/react/workflow-loom';
import { LOOM_RESTOCK_RUN14, RUN14_FAILURE } from '@microcks-deep-ink/storybook-shared/fixtures';
import { detailOf, itemParams } from './_meta';

export default {
  title: 'Patterns/Workflow run #14',
  parameters: itemParams(['workflow-loom', 'step-status', 'api-badge', 'run-target', 'run-origin', 'status-badge', 'callout', 'code-block', 'panel'], 'Run #14 of `restock-pastry`, as the Arazzo POC reports it. `patchPastry` passes its success criteria but fails Schema validation because `price` is the string "3.9"; it is retried twice after 1 s and fails after 3 attempts, and `verifyPastry` never runs. Only retry and end actions exist: no goto.', { layout: 'padded' }),
} satisfies Meta;

export const Default: StoryObj = {
  render: () => {
    const [selected, setSelected] = useState('patchPastry');
    const step = LOOM_RESTOCK_RUN14.steps.find((s) => s.stepId === selected);
    return (
      <div className="sb-col" style={{ maxWidth: 1040 }}>
        <header className="sb-col">
          <h1 style={{ font: 'var(--type-section)', margin: 0 }}>Run #14</h1>
          <div className="di-inline">
            <ApiBadge arazzo name="restock-pastry" />
            <StatusBadge status="failed" label="Failed at patchPastry" />
            <RunTarget target="mocks" />
            <RunOrigin origin="ui" />
          </div>
        </header>
        <Callout tone="danger" title="Run failed">{RUN14_FAILURE.summary}</Callout>
        <WorkflowLoom {...LOOM_RESTOCK_RUN14} selectedStep={selected} onStepSelect={(e: unknown) => setSelected(detailOf<{ stepId: string }>(e).stepId)} />
        {step ? (
          <Panel title={`Step: ${step.stepId}`} headingLevel={2}>
            <div className="sb-col">
              <DescriptionList
                items={[
                  { term: 'Operation', value: step.operation, mono: true },
                  { term: 'Source', value: step.source },
                  { term: 'Attempts', value: String(step.attempts ?? 0) },
                ]}
              />
              <div className="di-inline">
                <StepStatus status={step.status ?? 'not-run'} attempts={step.attempts && step.attempts > 1 ? step.attempts : undefined} />
                {step.checks ? <StepChecks successCriteria={step.checks.successCriteria} schemaValidation={step.checks.schemaValidation} /> : null}
              </div>
              {step.stepId === 'patchPastry' ? <CodeBlock caption={`${RUN14_FAILURE.request} · response`} language="json" lines={RUN14_FAILURE.response} /> : null}
            </div>
          </Panel>
        ) : null}
      </div>
    );
  },
};
