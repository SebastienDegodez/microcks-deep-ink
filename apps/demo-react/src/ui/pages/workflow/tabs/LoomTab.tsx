import { useState } from 'react';
import { runHeadline, stoppedStep, verdictExplanation, type WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Chip } from '@/ui/components/ui/chip';
import { Segmented } from '@/ui/components/ui/segmented';
import { PageLink, runPath } from '../../workflows/shared';
import { LoomHost } from '../LoomHost';
import { StepInspector } from '../StepInspector';
import { StepsTable } from '../StepsTable';
import { buildLoomProps, lensOf, runPickLabel, threadsOf } from '../loom-model';

export interface LoomTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  run?: WorkflowRun;
  step?: string;
  onPickRun: (number: number) => void;
  onSelectStep: (stepId: string | undefined) => void;
  inspectLink: (stepId: string) => string;
}

/** Run picker shared by the Loom and Steps tabs: the last four runs, as in the prototype. */
export function RunPicker({ runs, run, onPick, label }: { runs: WorkflowRun[]; run?: WorkflowRun; onPick: (n: number) => void; label: string }) {
  if (runs.length === 0) return null;
  const shown = runs.slice(0, 4);
  if (run && !shown.some((r) => r.number === run.number)) shown.push(run);
  return <Segmented label={label} options={shown.map((r) => ({ id: String(r.number), label: runPickLabel(r) }))} value={String(run?.number ?? '')} onChange={(id) => onPick(Number(id))} />;
}

export function LoomTab({ detail, runs, run, step, onPickRun, onSelectStep, inspectLink }: LoomTabProps) {
  const { workflow, document } = detail;
  const [lensExpr, setLensExpr] = useState<string | undefined>(undefined);
  const props = buildLoomProps(workflow, document, run, step);
  const threads = threadsOf(workflow);
  const lens = lensExpr ? lensOf(lensExpr, workflow, run) : undefined;
  const selected = workflow.steps.find((s) => s.stepId === step);
  const stopped = run ? stoppedStep(run) : undefined;
  const failedStepId = run?.status === 'FAILURE' ? stopped?.stepId : undefined;
  const headline = run ? runHeadline(run) : undefined;
  const others = [...new Set(document.sources.map((s) => s.name))].filter((n) => !workflow.steps.some((s) => s.sourceName === n));

  return (
    <div className="wf-section">
      <div className="wf-row-between">
        <div className="wf-row">
          <span className="wf-small wf-muted">Results and values from</span>
          <RunPicker runs={runs} run={run} onPick={onPickRun} label="Show results and resolved values from a run" />
        </div>
        <p className="wf-small wf-muted" style={{ margin: 0 }}>
          Legend: lanes are source descriptions, lines between steps are data threads, “end if” is an early end, “retry” is a retry loop.
        </p>
      </div>

      {run && headline ? (
        <Callout
          tone={run.status === 'SUCCESS' ? 'success' : run.status === 'FAILURE' ? 'danger' : 'info'}
          title={`${headline.title}${headline.detail ? ` · ${headline.detail}` : ''}`}
          actions={
            <>
              {failedStepId ? (
                <Button size="sm" onClick={() => onSelectStep(failedStepId)}>
                  Inspect {failedStepId}
                </Button>
              ) : null}
              <PageLink to={runPath(run.id)}>Open run #{run.number}</PageLink>
            </>
          }
        >
          {verdictExplanation(run)}
        </Callout>
      ) : (
        <Callout tone="info" title="No run yet">
          The loom shows the definition of the workflow. Run it to see the results on its steps.
        </Callout>
      )}

      <div className="wf-split">
        <div className="wf-section">
          <div className="wf-loom-box">
            <LoomHost
              {...props}
              onSelectStep={onSelectStep}
              fallback={
                <div className="wf-loom-fallback">
                  <Callout tone="info" title="The loom component is not copied into this demo build">
                    The steps below carry the same information as the loom: order, dependencies, status, checks and actions.
                  </Callout>
                  <StepsTable workflow={workflow} document={document} run={run} loomLink={inspectLink} />
                </div>
              }
            />
          </div>

          <section aria-labelledby="wf-lens-title" className="wf-lens">
            <h2 id="wf-lens-title" className="wf-h3">
              Expression lens
            </h2>
            <div className="wf-chip-line" role="group" aria-label="Data threads">
              {threads.map((t) => (
                <Chip key={`${t.expression}-${t.to}`} pressed={lensExpr === t.expression} onClick={() => setLensExpr(lensExpr === t.expression ? undefined : t.expression)}>
                  <code>{t.expression}</code>
                  <span className="di-sr-only"> to {t.to}</span>
                </Chip>
              ))}
            </div>
            {lens ? (
              <div role="region" aria-label="Expression lens result" className="wf-section">
                <div className="wf-row">
                  <code className="wf-expr">{lens.expression}</code>
                  <span>= {lens.value}</span>
                  {run ? <span className="wf-small wf-muted">in run #{run.number}</span> : null}
                  <Button size="sm" variant="ghost" onClick={() => setLensExpr(undefined)}>
                    Clear lens
                  </Button>
                </div>
                <dl className="wf-kv">
                  <dt>Produced by</dt>
                  <dd>{lens.producedBy}</dd>
                  <dt>Consumed by</dt>
                  <dd>
                    {lens.uses.length === 0 ? (
                      'Nothing'
                    ) : (
                      <ul className="wf-list">
                        {lens.uses.map((u) => (
                          <li key={`${u.who}-${u.what}`}>
                            {u.who} · {u.what} · {u.value}
                          </li>
                        ))}
                      </ul>
                    )}
                  </dd>
                </dl>
              </div>
            ) : (
              <p className="wf-small wf-muted" style={{ margin: 0 }}>
                Select a thread, an input or an output to trace where its value is produced and consumed.
              </p>
            )}
          </section>

          {others.length ? (
            <p className="wf-small wf-muted" style={{ margin: 0 }}>
              This workflow weaves {new Set(workflow.steps.map((s) => s.sourceName)).size} of the {document.sources.length} sourceDescriptions of <code>{document.file}</code>.{' '}
              {others.join(' and ')} {others.length === 1 ? 'is' : 'are'} used by the other workflows.
            </p>
          ) : null}
        </div>

        <StepInspector
          workflow={workflow}
          document={document}
          run={run}
          step={selected}
          failedStepId={failedStepId}
          onTrace={setLensExpr}
          onSelectFailed={() => failedStepId && onSelectStep(failedStepId)}
          onClose={() => onSelectStep(undefined)}
        />
      </div>
    </div>
  );
}
