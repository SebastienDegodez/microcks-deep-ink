import { useState } from 'react';
import { Link } from 'react-router';
import { stoppedStep, type Session, type WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Icon } from '@/ui/components/ui/icon';
import { workflowPath } from '../../workflows/shared';
import { LoomHost } from '../LoomHost';
import { RunPicker } from '../RunPicker';
import { StepInspector } from '../StepInspector';
import { StepsTable } from '../StepsTable';
import { buildLoomProps, lensOf } from '../loom-model';
import { runSummary } from '../run-facts';
import './loom.css';

export { RunPicker };

export interface LoomTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  run?: WorkflowRun;
  step?: string;
  sessions?: Session[];
  serviceLabel?: (serviceId: string) => string | undefined;
  onPickRun: (number: number) => void;
  onSelectStep: (stepId: string | undefined) => void;
  inspectLink: (stepId: string) => string;
}

export function LoomTab({ detail, runs, run, step, sessions, serviceLabel, onPickRun, onSelectStep, inspectLink }: LoomTabProps) {
  const { workflow, document } = detail;
  const uc = useUseCases();
  const ago = useRelativeTime();
  const [lensId, setLensId] = useState<string | undefined>(undefined);
  const others = useQuery(() => uc.arazzo.listWorkflows(), []);
  const props = buildLoomProps(workflow, document, run, step, serviceLabel);
  const lens = lensId ? lensOf(lensId, workflow, run) : undefined;
  const selected = workflow.steps.find((s) => s.stepId === step);
  const stopped = run ? stoppedStep(run) : undefined;
  const failedStepId = run?.status === 'FAILURE' ? stopped?.stepId : undefined;
  const summary = run ? runSummary(run, workflow, ago(run.startedAt), sessions) : undefined;
  const used = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const usedBy = (others.data ?? []).filter(
    (i) => i.document.id === document.id && i.workflow.workflowId !== workflow.workflowId && i.workflow.steps.some((s) => !used.includes(s.sourceName)),
  );
  // The other sources, in the order of the workflows that use them.
  const unused = [
    ...new Set([...usedBy.flatMap((i) => i.workflow.steps.map((s) => s.sourceName)), ...document.sources.map((s) => s.name)].filter((n) => !used.includes(n))),
  ];
  const trace = (id: string | undefined) => setLensId(id && id === lensId ? undefined : id);
  const sourceNames = props.sources.map((s) => s.name).join(', ');

  return (
    <div className="wf-loom-tab">
      <section aria-label="Workflow loom" className="wf-loom">
        <div className="wf-loom-toolbar">
          <RunPicker runs={runs} run={run} onPick={onPickRun} label="Show results and resolved values from a run" caption="Results & values from" />
          <div aria-label="Legend" role="group" className="wf-legend">
            <span>
              <span aria-hidden="true" className="wf-legend-warp" />
              warp: {sourceNames}
            </span>
            <span>
              <span aria-hidden="true" className="wf-legend-thread" />
              data thread
            </span>
            <span>
              <Icon name="end" size={14} />
              early end
            </span>
            <span>
              <Icon name="loop" size={14} />
              retry
            </span>
          </div>
        </div>

        {summary ? (
          <div className="wf-run-summary" data-tone={summary.tone}>
            <span className="wf-run-summary-title">
              <Icon name={summary.tone === 'success' ? 'check-circle' : summary.tone === 'danger' ? 'x-circle' : 'running'} size={14} strokeWidth={2.2} />
              {summary.title}
            </span>
            <span className="wf-run-summary-text">{summary.text}</span>
            <span className="wf-run-summary-end">{summary.end}</span>
          </div>
        ) : (
          <div className="wf-run-summary" data-tone="info">
            <span className="wf-run-summary-text">No run yet: the loom shows the definition of the workflow. Run it to see the results on its steps.</span>
          </div>
        )}

        <LoomHost
          {...props}
          lens={lensId}
          onSelectStep={onSelectStep}
          onSelectLens={setLensId}
          fallback={
            <div className="wf-loom-fallback">
              <Callout tone="info" title="The loom component is not copied into this demo build">
                The steps below carry the same information as the loom: order, dependencies, status, checks and actions.
              </Callout>
              <StepsTable workflow={workflow} document={document} run={run} loomLink={inspectLink} />
            </div>
          }
        />

        {lens ? (
          <div role="region" aria-label="Expression lens" className="wf-lens-on">
            <div className="wf-lens-head">
              <span className="wf-lens-name">
                <Icon name="search" size={15} />
                Expression lens
              </span>
              <span className="wf-lens-expr">{lens.expression}</span>
              <span className="wf-lens-value" data-tone={lens.missing ? 'bad' : undefined}>
                = {lens.value}
              </span>
              {run ? <span className="wf-lens-run">in run #{run.number}</span> : null}
              <Button size="sm" className="wf-lens-clear" onClick={() => setLensId(undefined)}>
                Clear lens
              </Button>
            </div>
            {lens.warn ? (
              <span className="wf-lens-warn">
                <Icon name="warning" size={14} />
                {lens.warn}
              </span>
            ) : null}
            <div className="wf-lens-produced">
              <span className="wf-lens-muted">Produced by</span>
              <span className="wf-lens-mono">{lens.producedBy}</span>
            </div>
            <div className="wf-lens-uses">
              <span className="wf-lens-muted">
                Consumed by {lens.uses.length} {lens.uses.length === 1 ? 'place' : 'places'}
              </span>
              <ul>
                {lens.uses.map((u) => (
                  <li key={`${u.who}-${u.what}`}>
                    <span className="wf-lens-who">{u.who}</span>
                    <span className="wf-lens-what">{u.what}</span>
                    <span className="wf-lens-val" data-tone={u.tone}>
                      {u.value}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="wf-lens-off">
            <Icon name="search" size={14} />
            Expression lens: select an input, an output or a thread label to trace where its value is produced and consumed.
          </p>
        )}

        {unused.length ? (
          <p className="wf-loom-foot">
            This workflow weaves {used.length} of the {document.sources.length} sourceDescriptions of <span className="wf-loom-mono">{document.file}</span>.{' '}
            {unused.map((n, i) => (
              <span key={n}>
                {i > 0 ? (i === unused.length - 1 ? ' and ' : ', ') : null}
                <span className="wf-loom-mono">{n}</span>
              </span>
            ))}{' '}
            {unused.length === 1 ? 'is' : 'are'} used by{' '}
            {usedBy.length
              ? usedBy.map((i, k) => (
                  <span key={i.workflow.workflowId}>
                    {k > 0 ? (k === usedBy.length - 1 ? ' and ' : ', ') : null}
                    <Link to={workflowPath(document.id, i.workflow.workflowId, 'loom')}>{i.workflow.workflowId}</Link>
                  </span>
                ))
              : 'the other workflows'}
            .
          </p>
        ) : null}
      </section>

      <StepInspector
        workflow={workflow}
        document={document}
        run={run}
        step={selected}
        failedStepId={failedStepId}
        serviceLabel={serviceLabel}
        lens={lensId}
        onTrace={trace}
        onSelectFailed={() => failedStepId && onSelectStep(failedStepId)}
        onClose={() => onSelectStep(undefined)}
      />
    </div>
  );
}

