import { useState } from 'react';
import { Link } from 'react-router';
import type { WorkflowExample, WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { ErrorBlock, LoadingBlock, runPath, runSetupPath } from '../../workflows/shared';
import { originWord } from '../run-facts';
import './examples.css';

export interface ExamplesTabProps {
  detail: WorkflowDetail;
  runs: WorkflowRun[];
  examples: WorkflowExample[];
  /** Service names by id ("pastry2" → "API Pastry 2.0"). */
  serviceLabel?: (serviceId: string) => string | undefined;
}

const fmt = (v: unknown) => String(v);

/** The last run on the mocks that played an example: it is judged against the example. */
function lastJudged(ex: WorkflowExample, runs: WorkflowRun[]) {
  const run = runs.find((r) => r.options.example === ex.id && r.target.kind === 'mocks' && r.status !== 'RUNNING');
  if (run) return { run, number: run.number, at: run.startedAt, matched: run.status === 'SUCCESS', where: originWord(run) };
  return ex.lastJudged ? { run: undefined, number: ex.lastJudged.runNumber, at: ex.lastJudged.at, matched: ex.lastJudged.matched, where: 'Microcks mocks' } : undefined;
}

export function ExamplesTab({ detail, runs, examples, serviceLabel }: ExamplesTabProps) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const { document, workflow } = detail;
  const overlay = useQuery(() => uc.arazzo.getDocumentOverlay(document.id), [document.id]);
  const [showOverlay, setShowOverlay] = useState(false);

  if (examples.length === 0) {
    return (
      <section aria-labelledby="wf-ex-title" className="wf-ex-panel">
        <h2 id="wf-ex-title">No recorded example</h2>
        <p className="wf-ex-lead">
          Examples come from an ArazzoSources overlay: they give the inputs of a run and what it must show. {document.overlay ? '' : `${document.file} has no overlay yet.`}
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="wf-ex-title" className="wf-ex-panel">
      <div className="wf-ex-head">
        <div className="wf-ex-intro">
          <h2 id="wf-ex-title">
            {examples.length} recorded {examples.length === 1 ? 'example' : 'examples'}
          </h2>
          <p className="wf-ex-lead">
            From the ArazzoSources overlay <span className="wf-ex-mono">{document.overlay}</span>, identified by {document.title} {document.version}. An example gives
            inputs and what the run must show: step statuses, where it ends and its outputs. Running an example judges the run against it.
          </p>
        </div>
        <Button size="sm" aria-expanded={showOverlay} aria-controls="wf-overlay" onClick={() => setShowOverlay((v) => !v)}>
          {showOverlay ? 'Hide the overlay' : 'Show the overlay'}
        </Button>
      </div>
      <div id="wf-overlay" hidden={!showOverlay}>
        {showOverlay ? (
          overlay.status === 'error' ? (
            <ErrorBlock error={overlay.error} onRetry={overlay.reload} />
          ) : overlay.data ? (
            <pre aria-label="ArazzoSources overlay" className="wf-ex-overlay">
              {overlay.data.replace(/\n$/, '')}
            </pre>
          ) : (
            <LoadingBlock label="Loading the overlay" rows={1} />
          )
        ) : null}
      </div>

      <div className="wf-ex-list">
        {examples.map((ex) => {
          const judged = lastJudged(ex, runs);
          const outputs = Object.entries(ex.outputs);
          return (
            <article key={ex.id} aria-labelledby={`wf-ex-${ex.id}`} className="wf-ex-card">
              <div className="wf-ex-card-head">
                <div className="wf-ex-card-title">
                  <h3 id={`wf-ex-${ex.id}`}>{ex.id}</h3>
                  <span className="wf-ex-desc">{ex.description}</span>
                </div>
                {workflow.runnability.runnable ? (
                  <Button asChild variant="primary" size="compact" icon="play">
                    <Link to={`${runSetupPath(document.id, workflow.workflowId)}?example=${ex.id}`} aria-label={`Run this example ${ex.id}`}>
                      Run this example
                    </Link>
                  </Button>
                ) : null}
              </div>
              <dl className="wf-ex-facts">
                <div>
                  <dt>Inputs</dt>
                  <dd className="wf-ex-tags">
                    {Object.keys(ex.inputs).length
                      ? Object.entries(ex.inputs).map(([k, v]) => (
                          <span key={k} className="wf-ex-tag">
                            {k} = {fmt(v)}
                          </span>
                        ))
                      : 'none'}
                  </dd>
                </div>
                <div>
                  <dt>Expected steps</dt>
                  <dd className="wf-ex-steps">
                    {workflow.steps.map((s) => {
                      const exp = ex.steps.find((x) => x.stepId === s.stepId);
                      const what = exp
                        ? [`Passed · ${exp.status}`, ...Object.entries(exp.outputs ?? {}).map(([k, v]) => `${k} = ${v}`)].join(' · ')
                        : 'Not run';
                      return (
                        <span key={s.stepId} className="wf-ex-step" data-run={exp ? undefined : 'no'}>
                          <Icon name={exp ? 'check-circle' : 'minus-circle'} size={12} strokeWidth={2.4} />
                          <span className="wf-ex-step-id">{s.stepId}</span>
                          <span className="wf-ex-muted">{what}</span>
                        </span>
                      );
                    })}
                  </dd>
                </div>
                <div>
                  <dt>Expected end</dt>
                  <dd className="wf-ex-mono">{ex.stopsAt ? `Stops at ${ex.stopsAt}` : 'Runs to its end'}</dd>
                  <dt className="wf-ex-dt-next">Expected outputs</dt>
                  <dd className="wf-ex-mono" data-empty={outputs.length ? undefined : ''}>
                    {outputs.length ? outputs.map(([k, v]) => `${k} = ${v}`).join(', ') : 'None expected'}
                  </dd>
                </div>
                <div>
                  <dt>Last judged</dt>
                  <dd className="wf-ex-judged">
                    {judged ? (
                      <>
                        <span className="wf-ex-verdict" data-tone={judged.matched ? 'pass' : 'fail'}>
                          <Icon name={judged.matched ? 'check-circle' : 'x-circle'} size={13} strokeWidth={2.2} />
                          {judged.matched ? 'Matches the example' : 'Does not match the example'}
                        </span>
                        <span className="wf-ex-muted">
                          {judged.run ? <Link to={runPath(judged.run.id)}>Run #{judged.number}</Link> : `Run #${judged.number}`} · {relative(judged.at)} · {judged.where}
                        </span>
                      </>
                    ) : (
                      <span className="wf-ex-muted">Not run yet</span>
                    )}
                  </dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
      {document.overlay ? (
        <p className="wf-ex-foot">
          The overlay also links the source descriptions:{' '}
          {document.sources.map((s, i) => (
            <span key={s.name}>
              {i > 0 ? ', ' : null}
              <span className="wf-ex-mono">{s.name}</span>
              {s.link.status === 'linked' ? ` → ${serviceLabel?.(s.link.serviceId) ?? s.link.serviceId}` : ' (not linked)'}
            </span>
          ))}
          . The Mock URL curl uses the inputs of the first example.
        </p>
      ) : null}
    </section>
  );
}
