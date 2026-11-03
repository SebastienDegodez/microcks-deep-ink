import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { callTotals, runHeadline, stepsTally, stoppedStep, verdictExplanation, type StepResult, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { formatClock, formatDuration } from '@/domain/shared';
import { PageHeader, useQuery, useRelativeTime, useSubscription, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { DescriptionList } from '@/ui/components/ui/description-list';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { Panel } from '@/ui/components/ui/panel';
import { StepChecks, StepStatus } from '@/ui/components/ui/step-status';
import { ButtonRouterLink, ErrorBlock, LoadingBlock, PageLink, ResultWord, RunOriginOf, RunTargetOf, runInputsText, runSetupPath, workflowPath } from '../workflows/shared';
import '../workflows/workflows.css';

type Phase = 'done' | 'running' | 'waiting';

/** Value shown for a JSON-ish output. */
const show = (v: unknown) => (typeof v === 'string' ? v : JSON.stringify(v));

export default function WorkflowRunPage() {
  const { runId = '' } = useParams();
  const [search] = useSearchParams();
  const live = search.has('live');
  const uc = useUseCases();
  usePageTitle('Workflow run · Microcks');

  const stored = useQuery(() => uc.arazzo.getRun(runId), [runId, live]);
  const stream = useSubscription<WorkflowRun, WorkflowRun | undefined>(live ? (l) => uc.arazzo.watchRun(runId, l) : undefined, [runId, live], { initial: undefined });
  const run = live ? (stream.value ?? undefined) : stored.data;

  const detail = useQuery(
    () => (run ? uc.arazzo.getWorkflow(run.documentId, run.workflowId) : Promise.resolve(undefined)),
    [run?.documentId, run?.workflowId],
  );

  if (!live && stored.status === 'error') {
    return (
      <>
        <PageHeader title="Workflow run" eyebrow="Workflows" />
        <ErrorBlock error={stored.error} onRetry={stored.reload} title="This run could not be loaded" />
      </>
    );
  }
  if (!run) {
    return (
      <>
        <PageHeader title="Workflow run" eyebrow="Workflows" />
        <LoadingBlock label="Loading the run" rows={5} />
      </>
    );
  }
  return <RunView run={run} live={live} paused={stream.paused} onTogglePause={stream.toggle} workflow={detail.data?.workflow} documentTitle={detail.data ? `${detail.data.document.title} ${detail.data.document.version}` : undefined} documentFile={detail.data?.document.file} apiId={detail.data?.document.apiId} />;
}

function phaseOf(run: WorkflowRun, index: number): Phase {
  if (run.status !== 'RUNNING') return 'done';
  const currentIndex = run.steps.findIndex((s) => s.stepId === run.current?.stepId);
  if (currentIndex < 0) return run.steps[index]?.status === 'not-run' ? 'waiting' : 'done';
  return index < currentIndex ? 'done' : index === currentIndex ? 'running' : 'waiting';
}

function RunView({
  run,
  live,
  paused,
  onTogglePause,
  workflow,
  documentTitle,
  documentFile,
  apiId,
}: {
  run: WorkflowRun;
  live: boolean;
  paused: boolean;
  onTogglePause: () => void;
  workflow?: Workflow;
  documentTitle?: string;
  documentFile?: string;
  apiId?: string;
}) {
  const relative = useRelativeTime();
  const running = run.status === 'RUNNING';
  const headline = runHeadline(run);
  const totals = callTotals(run);
  const stopped = stoppedStep(run);
  const total = run.steps.length;
  const currentIndex = running ? Math.max(0, run.steps.findIndex((s) => s.stepId === run.current?.stepId)) : total;

  // Polite, not chatty: one sentence when the current step changes, one when the run ends.
  const [message, setMessage] = useState('');
  const lastStep = useRef<string | undefined>(undefined);
  const currentStepId = run.current?.stepId;
  useEffect(() => {
    if (running && currentStepId) {
      if (lastStep.current !== currentStepId) {
        lastStep.current = currentStepId;
        setMessage(`Step ${currentIndex + 1} of ${total}, ${currentStepId}, running.`);
      }
    } else if (!running && lastStep.current !== '__done') {
      lastStep.current = '__done';
      setMessage(`${headline.title}. ${headline.detail}`.trim());
    }
  }, [running, currentStepId, currentIndex, total, headline.title, headline.detail]);

  const endpoint = apiId && workflow ? `/api/arazzo/documents/${apiId}/workflows/${workflow.workflowId}/runs` : undefined;
  const curl = endpoint
    ? `curl -X POST 'http://microcks.local:8080${endpoint}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify({ target: run.target.kind === 'implementations' ? { kind: 'implementations', baseUrls: run.target.baseUrls } : { kind: run.target.kind }, ...(run.options.example ? { example: run.options.example } : {}), inputs: run.options.inputs, validateSchemas: run.options.validateSchemas, timeoutMs: run.options.timeoutMs })}'`
    : undefined;

  const outputs = Object.entries(run.outputs);
  const baggageOf = (s: StepResult) => s.baggage;
  const firstBaggage = run.steps.find((s) => s.baggage)?.baggage;

  return (
    <>
      <PageHeader
        title="Workflow run"
        eyebrow={
          <>
            <Link to="/workflows">Workflows</Link> › <Link to={workflowPath(run.documentId, run.workflowId, 'runs')}>{run.workflowId} runs</Link> › Run #{run.number}
          </>
        }
        badge={<ApiBadge arazzo name={`${run.workflowId} · run #${run.number}`} />}
        actions={
          <>
            {live ? (
              <Button onClick={onTogglePause} aria-pressed={paused} icon={paused ? 'play' : 'pause'}>
                {paused ? 'Resume' : 'Pause'} updates
              </Button>
            ) : null}
            {!running ? (
              <ButtonRouterLink to={runSetupPath(run.documentId, run.workflowId)} icon="retry">
                Run again
              </ButtonRouterLink>
            ) : null}
          </>
        }
      />
      <p className="wf-row wf-small" style={{ margin: 0 }}>
        {running ? <LiveIndicator paused={paused} /> : <ResultWord result={run.status === 'SUCCESS' ? 'passed' : 'failed'} />}
        <RunTargetOf run={run} />
        <RunOriginOf origin={run.origin} />
        <span>
          Started {relative(run.startedAt)} · {formatClock(run.startedAt)}
        </span>
        {totals.ms > 0 ? <span>Duration {formatDuration(totals.ms)}</span> : null}
      </p>
      <p className="di-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </p>

      <div className="wf-grid-2">
        <div className="wf-section">
          {running ? (
            <section aria-label="Progress" className="wf-progress" aria-busy="true">
              <p style={{ margin: 0 }}>
                <strong>
                  {Math.min(currentIndex, total)} of {total}
                </strong>{' '}
                steps ended · {run.current ? `${run.current.stepId}${run.current.attempt > 1 ? `, attempt ${run.current.attempt}` : ''} running` : 'starting'}
              </p>
              <div className="wf-segments" role="img" aria-label={`Progress: ${run.steps.map((s, i) => `${s.stepId} ${phaseOf(run, i) === 'running' ? 'running' : phaseOf(run, i) === 'waiting' ? 'waiting' : s.status}`).join(', ')}`}>
                {run.steps.map((s, i) => {
                  const ph = phaseOf(run, i);
                  return (
                    <div key={s.stepId} className="wf-segment" data-status={ph === 'done' ? s.status : ph === 'running' ? 'running' : 'not-run'}>
                      {s.stepId}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section aria-label="Run summary" className="wf-section">
              <Callout tone={run.status === 'SUCCESS' ? 'success' : 'danger'} title={`${headline.title}${headline.detail ? ` · ${headline.detail}` : ''}`}>
                {verdictExplanation(run)}
              </Callout>
              <dl className="wf-tally">
                <div>
                  <dt>Duration</dt>
                  <dd>{formatDuration(totals.ms)}</dd>
                </div>
                <div>
                  <dt>Calls</dt>
                  <dd>{totals.calls}</dd>
                </div>
                <div>
                  <dt>Steps</dt>
                  <dd>{stepsTally(run)}</dd>
                </div>
              </dl>
              <h2 className="wf-h2">Workflow outputs</h2>
              {outputs.length > 0 ? (
                <table className="di-table">
                  <caption className="di-sr-only">Workflow outputs</caption>
                  <thead>
                    <tr>
                      <th scope="col">Output</th>
                      <th scope="col">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outputs.map(([name, value]) => (
                      <tr key={name}>
                        <th scope="row">{name}</th>
                        <td>
                          <code>{show(value)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="wf-muted">{run.status === 'FAILURE' ? 'No outputs: the workflow stopped before producing them.' : 'This workflow declares no output.'}</p>
              )}
              <div className="wf-row">
                {run.relatedTestRunId ? <PageLink to={`/tests/runner/${run.relatedTestRunId}`}>Same bug in test run #{run.relatedTestRunId}</PageLink> : null}
                <PageLink to={workflowPath(run.documentId, run.workflowId, 'loom', { run: String(run.number), step: stopped?.stepId })}>Back to the workflow</PageLink>
              </div>
            </section>
          )}

          {run.coherence.length > 0 && !running ? (
            <Callout
              tone="warning"
              title="The mocks do not form a coherent scenario"
              actions={
                <ButtonRouterLink to={`/services/pastry2/copilot?op=get-name&hint=${encodeURIComponent(run.coherence[0]?.missing.split('=').pop()?.trim() ?? 'Tarte Tatin')}`} size="sm">
                  Generate the example with the AI Copilot
                </ButtonRouterLink>
              }
            >
              {run.coherence.map((c) => (
                <span key={c.stepId} style={{ display: 'block' }}>
                  <code>{c.stepId}</code> needs {c.missing}, and <code>{c.operationId}</code> has none. Add that example to the OpenAPI document, or let the workflow send a value that has one.
                </span>
              ))}
            </Callout>
          ) : null}

          <section aria-labelledby="run-steps-h" className="wf-section">
            <h2 id="run-steps-h" className="wf-h2">
              Steps
            </h2>
            <ol className="wf-steps" aria-label="Workflow steps">
              {run.steps.map((s, i) => (
                <StepItem key={s.stepId} index={i} step={s} phase={phaseOf(run, i)} run={run} workflow={workflow} baggage={baggageOf(s)} />
              ))}
            </ol>
          </section>
        </div>

        <aside aria-label="Run side panels" className="wf-section">
          <Panel title="Properties">
            <DescriptionList
              items={[
                {
                  term: 'Workflow',
                  value: (
                    <>
                      <PageLink to={workflowPath(run.documentId, run.workflowId)}>{run.workflowId}</PageLink> in {documentTitle ?? run.documentId}
                      {documentFile ? <span className="wf-small wf-muted"> · {documentFile}</span> : null}
                    </>
                  ),
                },
                { term: 'Target', value: targetText(run) },
                { term: 'Secret', value: run.options.secret ?? 'none' },
                { term: 'Inputs', value: runInputsText(run) },
                { term: 'Schema validation', value: run.options.validateSchemas ? 'On' : 'Off' },
                { term: 'Timeout per step', value: `${run.options.timeoutMs} ms` },
                ...(run.options.example ? [{ term: 'Example', value: run.options.example }] : []),
                ...(firstBaggage ? [{ term: 'Baggage', value: <code className="wf-small">{firstBaggage}</code> }] : []),
                { term: 'Origin', value: run.origin.kind === 'session' ? `Session ${run.origin.sessionId}` : run.origin.kind === 'ui' ? 'UI · Run a workflow' : run.origin.kind === 'api' ? 'API' : 'Mock URL' },
              ]}
            />
            {firstBaggage ? (
              <p className="wf-small" style={{ margin: 0 }}>
                <PageLink to={`/traces?run=${run.id}`}>Open in Live traces</PageLink>
              </p>
            ) : null}
          </Panel>
          {curl ? (
            <Panel title="Run it from the API">
              <p className="wf-small wf-muted" style={{ margin: 0 }}>
                <code>POST {endpoint}</code>
              </p>
              <CodeBlock language="bash" caption="curl command that launches the same run" code={curl} />
            </Panel>
          ) : null}
        </aside>
      </div>
    </>
  );
}

function targetText(run: WorkflowRun): string {
  if (run.target.kind === 'mocks') return 'Microcks mocks';
  if (run.target.kind === 'implementations') return `Implementations · ${Object.values(run.target.baseUrls).join(', ')}`;
  return `Mixed (proposed, beyond POC) · ${Object.entries(run.target.perSource).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
}

function StepItem({ index, step, phase, run, workflow, baggage }: { index: number; step: StepResult; phase: Phase; run: WorkflowRun; workflow?: Workflow; baggage: string }) {
  const def = workflow?.steps.find((s) => s.stepId === step.stepId);
  const coherence = run.coherence.find((c) => c.stepId === step.stepId);
  const finished = phase === 'done' && step.status !== 'not-run';
  const outcome = phase === 'done' ? step.status : 'not-run';
  const word = phase === 'running' ? 'Running' : phase === 'waiting' ? 'Waiting' : undefined;
  const validated = run.options.validateSchemas;
  const criteriaState = !finished ? 'not-evaluated' : step.criteria.every((c) => c.held) ? 'passed' : 'failed';
  const schemaState = !validated ? undefined : !finished ? 'not-evaluated' : step.schema.state === 'pass' ? 'passed' : step.schema.state === 'fail' ? 'failed' : 'off';

  return (
    <li className="wf-step" data-status={outcome}>
      <Disclosure
        defaultOpen={step.status === 'failed' || phase === 'running'}
        summary={
          <span className="wf-step-title">
            <strong>
              {index + 1}. {step.stepId}
            </strong>
            {def ? (
              <span className="wf-small wf-muted">
                {def.method} {def.path} · {def.operationId}
              </span>
            ) : null}
            {word ? (
              <span className="wf-result" data-result="running">
                {word}
              </span>
            ) : (
              <StepStatus status={outcome} attempts={step.attempts.length > 1 ? step.attempts.length : undefined} />
            )}
          </span>
        }
      >
        <div className="wf-step-body">
          {!finished ? (
            <p className="wf-muted" role="note" style={{ margin: 0 }}>
              {step.status === 'not-run' && phase === 'done' ? 'Not run: an earlier step ended the workflow.' : phase === 'running' ? 'Waiting for the response.' : 'Waiting for the previous steps.'}
            </p>
          ) : (
            <>
              {step.request ? (
                <div className="wf-section">
                  <h3 className="wf-h3">Request</h3>
                  <p className="wf-row" style={{ margin: 0 }}>
                    <code>{step.request.method}</code>
                    <code className="wf-mono">{step.request.url}</code>
                  </p>
                  {Object.keys(step.request.params).length > 0 ? (
                    <table className="di-table">
                      <caption className="di-sr-only">Parameters of {step.stepId}</caption>
                      <thead>
                        <tr>
                          <th scope="col">Parameter</th>
                          <th scope="col">Value</th>
                          <th scope="col">From</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(step.request.params).map(([name, value]) => {
                          const p = def?.parameters.find((x) => x.name === name);
                          return (
                            <tr key={name}>
                              <th scope="row">
                                {name} {p ? <span className="wf-small wf-muted">{p.in}</span> : null}
                              </th>
                              <td>
                                <code>{value}</code>
                              </td>
                              <td>
                                <code>{p?.value ?? ''}</code>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : null}
                  {step.request.body ? <CodeBlock language="json" caption={`requestBody${def?.requestBody ? ` · template ${def.requestBody}` : ''}`} code={step.request.body} /> : null}
                  {baggage ? (
                    <p className="wf-small" style={{ margin: 0 }}>
                      Baggage <code>{baggage}</code> · <PageLink to={`/traces?run=${run.id}`}>See in Live traces</PageLink>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {step.attempts.length > 1 ? (
                <div className="wf-section">
                  <h3 className="wf-h3">Attempts</h3>
                  <ol className="wf-attempts">
                    {step.attempts.map((a) => (
                      <li key={a.n}>
                        Attempt {a.n} · <strong>{a.httpStatus}</strong> · {formatDuration(a.ms)} · {a.when}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {step.response ? (
                <div className="wf-section">
                  <h3 className="wf-h3">Response</h3>
                  <CodeBlock language="json" caption={step.response.meta} lines={step.response.lines} />
                </div>
              ) : null}

              <StepChecks successCriteria={criteriaState} schemaValidation={schemaState} />
              {step.criteria.length > 0 ? (
                <table className="di-table">
                  <caption className="di-sr-only">Success criteria of {step.stepId}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Criterion</th>
                      <th scope="col">Evaluated</th>
                      <th scope="col">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {step.criteria.map((c) => (
                      <tr key={c.condition}>
                        <th scope="row">
                          <code>{c.condition}</code> {c.kind === 'regex' ? <span className="wf-small wf-muted">regex</span> : null}
                        </th>
                        <td>{c.evaluation}</td>
                        <td>{c.held ? 'Held' : 'Did not hold'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              {validated && step.schema.message ? (
                <p className="wf-small" style={{ margin: 0 }}>
                  <code>{step.schema.ref}</code> · {step.schema.message}
                </p>
              ) : null}

              {coherence ? (
                <Callout tone="warning" title="The mocks do not form a coherent scenario">
                  {coherence.missing} is missing for <code>{coherence.operationId}</code>.
                </Callout>
              ) : null}

              <p className="wf-small" style={{ margin: 0 }}>
                <strong>Outputs</strong>{' '}
                {Object.keys(step.outputs).length > 0 ? Object.entries(step.outputs).map(([k, v]) => `${k} = ${show(v)}`).join(' · ') : 'none'}
              </p>
              <p className="wf-small" style={{ margin: 0 }}>
                <strong>{step.flow.title}</strong> {step.flow.text}
              </p>
            </>
          )}
        </div>
      </Disclosure>
    </li>
  );
}
