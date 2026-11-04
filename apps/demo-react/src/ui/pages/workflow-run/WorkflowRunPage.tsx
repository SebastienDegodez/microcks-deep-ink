import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import {
  callTotals,
  endLabel,
  judgeExample,
  runHeadline,
  stepsTally,
  stoppedStep,
  verdictExplanation,
  resolveExpression,
  runContext,
  type Step,
  type Workflow,
  type WorkflowExample,
  type WorkflowRun,
} from '@/domain/arazzo';
import { formatClock, formatDuration } from '@/domain/shared';
import { RUN_SCENARIOS, type RunScenario } from '@/application/arazzo';
import { PageHeader, useQuery, useRelativeTime, useSubscription, useUseCases, usePageTitle } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { ButtonRouterLink, ErrorBlock, LoadingBlock, runPath, runSetupPath, workflowPath } from '../workflows/shared';
import { MetaItem, RunApiPanel, RunBadges, Verdict, implementationsText, runBreadcrumb } from './run-parts';
import { RunSteps, phaseOf } from './RunSteps';
import './workflow-run.css';

/** JSON-ish value as the prototype prints it: `"Eclair Cafe"`, `3.9`. */
const J = (v: unknown) => JSON.stringify(v);

export default function WorkflowRunPage() {
  const { runId = '' } = useParams();
  const [search] = useSearchParams();
  const live = search.has('live');
  const uc = useUseCases();
  usePageTitle('Workflow run · Microcks');

  const stored = useQuery(() => uc.arazzo.getRun(runId), [runId, live]);
  const stream = useSubscription<WorkflowRun, WorkflowRun[]>(live ? (l) => uc.arazzo.watchRun(runId, l) : undefined, [runId, live], {
    initial: [],
    reduce: (frames, frame) => [...frames, frame],
  });
  const replay = useReplay(stream.value);
  const run = live ? replay.frame : stored.data;

  const detail = useQuery(
    () => (run ? uc.arazzo.getWorkflow(run.documentId, run.workflowId) : Promise.resolve(undefined)),
    [run?.documentId, run?.workflowId],
  );
  const examples = useQuery(
    () => (run ? uc.arazzo.listExamples(run.documentId, run.workflowId) : Promise.resolve([])),
    [run?.documentId, run?.workflowId],
  );

  if (!live && stored.status === 'error') {
    return (
      <>
        <PageHeader title="Workflow run" />
        <ErrorBlock error={stored.error} onRetry={stored.reload} title="This run could not be loaded" />
      </>
    );
  }
  if (!run) {
    return (
      <>
        <PageHeader title="Workflow run" />
        <LoadingBlock label="Loading the run" rows={5} />
      </>
    );
  }
  const d = detail.data;
  return (
    <RunView
      run={run}
      paused={replay.paused}
      onTogglePause={replay.toggle}
      onStepForward={replay.canStep ? replay.step : undefined}
      detail={d}
      example={examples.data?.find((e) => e.id === run.options.example)}
    />
  );
}


/** Gap between two replayed frames once the replay is behind the stream (after a pause), in ms. */
const REPLAY_TICK_MS = 1000;

/**
 * Plays the buffered frames of a live run one by one. Pause stops the replay clock where it is (WCAG 2.2.2):
 * Resume continues from that frame, one frame per tick, and Step forward shows the next frame while paused.
 */
function useReplay(frames: readonly WorkflowRun[]) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Set by a pause, cleared once the replay has caught up with the stream.
  const [behind, setBehind] = useState(false);
  const last = frames.length - 1;
  useEffect(() => {
    if (paused) return undefined;
    if (index >= last) {
      if (behind) setBehind(false);
      return undefined;
    }
    // Caught up: show a new frame as soon as it arrives. Behind (after a pause): one frame per tick.
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), behind || last - index > 1 ? REPLAY_TICK_MS : 0);
    return () => clearTimeout(timer);
  }, [paused, behind, index, last]);
  const frame = frames[Math.min(index, Math.max(last, 0))];
  return {
    frame,
    paused,
    toggle: () => {
      setPaused((p) => !p);
      setBehind(true);
    },
    canStep: paused && index < last,
    step: () => setIndex((i) => Math.min(i + 1, last)),
  };
}

type Detail = Awaited<ReturnType<ReturnType<typeof useUseCases>['arazzo']['getWorkflow']>>;

/** The three prototype scenarios, each opening on its run (#14, #15, #16). */
const SCENARIO_DOT: Record<RunScenario, 'danger' | 'success' | 'warning'> = { impl14: 'danger', mocksEnd: 'success', mocksMissing: 'warning' };

function ScenarioBar({ run }: { run: WorkflowRun }) {
  return (
    <div className="wfr-scenarios">
      <span id="wfr-scn-label" className="wfr-scenarios-label">
        Scenario
      </span>
      <ul aria-labelledby="wfr-scn-label" className="wfr-scenarios-list">
        {(Object.keys(RUN_SCENARIOS) as RunScenario[]).map((key) => {
          const s = RUN_SCENARIOS[key];
          const current = s.runId === run.id;
          return (
            <li key={key}>
              <RouterLink to={runPath(s.runId)} className="wfr-scenario" aria-current={current ? 'page' : undefined}>
                <span className="wfr-scenario-dot" data-tone={SCENARIO_DOT[key]} aria-hidden="true" />
                {s.label}
              </RouterLink>
            </li>
          );
        })}
      </ul>
      <span className="wfr-scenarios-note">Three runs of restock-pastry for review: each opens on its result; Replay live plays it step by step.</span>
    </div>
  );
}

function RunView({
  run,
  paused,
  onTogglePause,
  onStepForward,
  detail,
  example,
}: {
  run: WorkflowRun;
  paused: boolean;
  onTogglePause: () => void;
  onStepForward?: () => void;
  detail?: Detail;
  example?: WorkflowExample;
}) {
  const relative = useRelativeTime();
  const running = run.status === 'RUNNING';
  const headline = runHeadline(run);
  const totals = callTotals(run);
  const total = run.steps.length;
  const workflow = detail?.workflow;
  const documentLabel = detail ? `${detail.document.title} ${detail.document.version}` : undefined;
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

  // When the live run ends, its Pause / Skip buttons go away: move focus to the verdict instead of losing it.
  const wasRunning = useRef(running);
  useEffect(() => {
    if (wasRunning.current && !running) {
      const active = document.activeElement;
      if (!active || active === document.body) document.getElementById('wfr-verdict-h')?.focus();
    }
    wasRunning.current = running;
  }, [running]);

  const workflowTo = workflowPath(run.documentId, run.workflowId);
  const runsTo = workflowPath(run.documentId, run.workflowId, 'runs');
  const passed = run.status === 'SUCCESS';
  const isScenarioWorkflow = run.workflowId === 'restock-pastry' && run.documentId === 'pastry';

  const chip = running ? (
    <span className="wfr-running">
      <LiveIndicator paused={paused} />
      <span className="wfr-running-label" role="status">
        <Icon name="running" size={14} strokeWidth={2.6} className="wfr-spin" />
        Running · step {Math.min(currentIndex + 1, total)} of {total}
        {run.current && run.current.attempt > 1 ? ` · attempt ${run.current.attempt}` : ''}
      </span>
    </span>
  ) : (
    <ApiBadge label="result" value={passed ? 'passed' : 'failed'} status={passed ? 'success' : 'danger'} />
  );

  return (
    <>
      <PageHeader
        title={`Run #${run.number}`}
        breadcrumb={runBreadcrumb(detail ? `${detail.document.title} - ${detail.document.version}` : undefined, workflowTo, runsTo, `Run #${run.number}`)}
        badge={<RunBadges workflowId={run.workflowId} documentLabel={documentLabel} to={workflowTo} chip={chip} />}
        descriptionTone="secondary"
        descriptionWidth={900}
        align="start"
        description={
          <span className="wfr-meta">
            {detail ? (
              <MetaItem label="Document">
                <RouterLink to={workflowPath(run.documentId, run.workflowId, 'source')} className="wfr-meta-file">
                  {detail.document.file}
                </RouterLink>
              </MetaItem>
            ) : null}
            <MetaItem label="Run against">
              <span className="wfr-meta-value">{targetLine(run)}</span>
            </MetaItem>
            <MetaItem label="Started">
              <span className="wfr-meta-value">{relative(run.startedAt)}</span>
              <span className="wfr-meta-clock">{formatClock(run.startedAt)}</span>
            </MetaItem>
            <MetaItem label={running ? 'Elapsed' : 'Duration'}>
              <span className="wfr-meta-mono">{formatDuration(totals.ms)}</span>
            </MetaItem>
            <MetaItem label="Launched by">
              <span className="wfr-meta-value">{launchedBy(run)}</span>
            </MetaItem>
          </span>
        }
        actions={
          running ? (
            <>
              <Button onClick={onTogglePause} aria-pressed={paused} icon={paused ? 'play' : 'pause'}>
                {paused ? 'Resume' : 'Pause'} updates
              </Button>
              <ButtonRouterLink to={runPath(run.id)} variant="primary" icon="skip">
                Skip to result
              </ButtonRouterLink>
            </>
          ) : (
            <>
              <ButtonRouterLink to={runPath(run.id, true)} icon="reset">
                Replay live
              </ButtonRouterLink>
              <ButtonRouterLink to={runSetupPath(run.documentId, run.workflowId, scenarioOf(run.id))} variant="primary" icon="play">
                Run again
              </ButtonRouterLink>
            </>
          )
        }
      />
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {message}
      </p>

      {isScenarioWorkflow ? <ScenarioBar run={run} /> : null}

      <div className="wfr-layout">
        <div className="wfr-main">
          {running ? <Progress run={run} workflow={workflow} currentIndex={currentIndex} validated={run.options.validateSchemas} paused={paused} onStepForward={onStepForward} /> : <Summary run={run} totals={totals} workflow={workflow} />}
          {example ? <ExampleJudging run={run} example={example} pending={running} /> : null}
          <RunSteps run={run} workflow={workflow} />
        </div>

        <aside aria-label="Run side panels" className="wfr-aside">
          <Properties run={run} detail={detail} example={example} />
          {detail && workflow ? (
            <RunApiPanel
              hint={`Launches the same run as run #${run.number}.`}
              documentApiId={detail.document.apiId}
              documentLabel={documentLabel ?? ''}
              workflowId={run.workflowId}
              mockUrl={workflow.mockUrl}
              mixed={run.target.kind === 'mixed'}
              body={apiBodyOf(run)}
            />
          ) : null}
        </aside>
      </div>
    </>
  );
}

function scenarioOf(runId: string): RunScenario | undefined {
  return (Object.keys(RUN_SCENARIOS) as RunScenario[]).find((k) => RUN_SCENARIOS[k].runId === runId);
}

function launchedBy(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return run.origin.app;
  if (run.origin.kind === 'api') return 'API';
  if (run.origin.kind === 'mock-url') return 'Mock URL';
  return 'MA';
}

function targetLine(run: WorkflowRun): string {
  if (run.target.kind === 'mocks') return 'Microcks mocks';
  if (run.target.kind === 'implementations') return `Implementations · ${implementationsText(run.target.baseUrls)}`;
  return 'Mixed · proposed, beyond POC';
}

function apiBodyOf(run: WorkflowRun) {
  return {
    inputs: run.options.inputs,
    timeout: run.options.timeoutMs,
    ...(run.target.kind === 'implementations' ? { implementations: run.target.baseUrls } : {}),
    ...(run.target.kind !== 'mocks' && run.options.secret ? { secretName: run.options.secret } : {}),
    validateSchema: run.options.validateSchemas,
    ...(run.options.example ? { example: run.options.example } : {}),
  };
}

/* ------------------------------------------------------------------------------------- running */

function Progress({ run, workflow, currentIndex, validated, paused, onStepForward }: { run: WorkflowRun; workflow?: Workflow; currentIndex: number; validated: boolean; paused: boolean; onStepForward?: () => void }) {
  const total = run.steps.length;
  const ended = Math.min(currentIndex, total);
  const current = run.current ? run.steps.find((s) => s.stepId === run.current?.stepId) : undefined;
  const retrying = run.current && run.current.attempt > 1;
  const nowTitle = !current ? 'Now calling' : retrying ? `Retrying · attempt ${run.current?.attempt} of ${current.attempts.length}` : 'Now calling';
  const def = workflow?.steps.find((s) => s.stepId === current?.stepId);
  const target = current?.request ? `${current.request.method} ${current.request.url}` : def ? `${def.method} ${resolvedUrl(run, def)}` : '';
  const nowLabel = !current ? 'All steps ended · computing the result…' : retrying ? `retryAfter → ${target}` : target;
  const label = (i: number) => {
    const ph = phaseOf(run, i);
    return ph === 'running' ? 'running' : ph === 'waiting' ? 'queued' : run.steps[i]?.status === 'not-run' ? 'not run' : (run.steps[i]?.status ?? '');
  };
  return (
    <section aria-label="Progress" className="wfr-card wfr-progress" aria-busy="true">
      <div className="wfr-progress-head">
        <p className="wfr-progress-count">
          <span className="wfr-progress-big">{ended}</span>
          <span className="wfr-progress-of">/{total}</span>
          <span className="wfr-progress-word">steps ended</span>
        </p>
        <p className="wfr-progress-now">
          <span className="wfr-progress-now-title">{nowTitle}</span>
          <span className="wfr-progress-now-label">{nowLabel}</span>
        </p>
      </div>
      <div className="wfr-segments" role="img" aria-label={`Progress: ${run.steps.map((s, i) => `${s.stepId} ${label(i)}`).join(', ')}`}>
        {run.steps.map((s, i) => {
          const ph = phaseOf(run, i);
          return <span key={s.stepId} className="wfr-segment" data-status={ph === 'done' ? s.status : ph === 'running' ? 'running' : 'queued'} />;
        })}
      </div>
      <div className="wfr-progress-foot">
        <p className="wfr-progress-note">
          Steps run in list order. Each step resolves its runtime expressions, calls its operation, then checks its success criteria
          {validated ? ' and validates its response against its OpenAPI schema' : ''}.
        </p>
        {paused ? (
          <Button size="sm" icon="chevron" onClick={onStepForward} aria-disabled={onStepForward ? undefined : true}>
            Step forward
          </Button>
        ) : null}
      </div>
    </section>
  );
}

/** URL a step calls, resolved from the inputs and the outputs the run has so far (before its request exists). */
function resolvedUrl(run: WorkflowRun, def: Step): string {
  const ctx = runContext(run);
  let path = def.path;
  const query: string[] = [];
  for (const p of def.parameters) {
    const v = p.value.startsWith('$') ? resolveExpression(p.value, ctx) : p.value;
    const text = v === undefined ? `{${p.name}}` : String(v);
    if (p.in === 'path') path = path.replace(`{${p.name}}`, encodeURIComponent(text));
    else if (p.in === 'query') query.push(`${p.name}=${encodeURIComponent(text)}`);
  }
  const base = run.target.kind === 'implementations' ? (run.target.baseUrls[def.sourceName] ?? '') : (run.steps.find((x) => x.request)?.request?.url.replace(/\/pastries.*$/, '') ?? '');
  return `${base}${path}${query.length ? `?${query.join('&')}` : ''}`;
}

/* ------------------------------------------------------------------------------------- summary */

function Summary({ run, totals, workflow }: { run: WorkflowRun; totals: { calls: number; ms: number }; workflow?: Workflow }) {
  const passed = run.status === 'SUCCESS';
  const stopped = stoppedStep(run);
  const outputs = Object.entries(run.outputs);
  const workflowOutputs = new Map((workflow?.outputs ?? []).map((o) => [o.name, o.expression]));
  return (
    <section aria-label="Run summary" className="wfr-card wfr-summary" data-result={passed ? 'passed' : 'failed'}>
      <div className="wfr-summary-head">
        <div className="wfr-summary-text">
          <h2 className="wfr-verdict-title" id="wfr-verdict-h" tabIndex={-1}>
            <Icon name={passed ? 'check' : 'cross'} size={20} strokeWidth={2.6} />
            {passed ? 'Run passed' : 'Run failed'}
          </h2>
          <span className="wfr-summary-end">{endLabel(run)}</span>
          <span className="wfr-summary-explain">{explanationOf(run, workflow)}</span>
        </div>
        <dl className="run-facts wfr-summary-facts" data-layout="columns">
          <div className="run-facts-row">
            <dt>Duration</dt>
            <dd className="wfr-stat">{formatDuration(totals.ms)}</dd>
          </div>
          <div className="run-facts-row">
            <dt>Calls</dt>
            <dd className="wfr-stat">{totals.calls}</dd>
          </div>
          <div className="run-facts-row">
            <dt>Steps</dt>
            <dd className="wfr-stat-text">{stepsTally(run)}</dd>
          </div>
        </dl>
      </div>

      <StepsBand run={run} />

      <div className="wfr-block">
        <h3 className="wfr-h3">Workflow outputs</h3>
        {outputs.length > 0 ? (
          <div className="wfr-table-wrap">
            <table className="wfr-table">
              <caption className="sr-only">Workflow outputs</caption>
              <thead>
                <tr>
                  <th scope="col">Output</th>
                  <th scope="col">Runtime expression</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {outputs.map(([name, value]) => (
                  <tr key={name}>
                    <th scope="row" className="wfr-mono-strong">
                      {name}
                    </th>
                    <td className="wfr-mono-secondary">{workflowOutputs.get(name) ?? ''}</td>
                    <td className="wfr-mono-strong">{J(value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="wfr-muted">{passed ? 'None.' : `None: the workflow stopped at ${stopped?.stepId ?? 'a step'} and produced no outputs.`}</p>
        )}
      </div>

      <div className="wfr-actions">
        {run.relatedTestRunId ? (
          <RouterLink to={`/tests/runner/${run.relatedTestRunId}`} className="wfr-action" data-tone="danger">
            <Icon name="warning" size={14} strokeWidth={2.4} />
            Same bug in test run #{run.relatedTestRunId}
          </RouterLink>
        ) : null}
        {run.coherence[0] ? (
          <RouterLink to={`/services/pastry2/copilot?op=get-name&hint=${encodeURIComponent(run.coherence[0].copilotHint)}`} className="wfr-action" data-tone="action">
            <Icon name="sparkles" size={14} />
            Generate the example with the AI Copilot
          </RouterLink>
        ) : null}
        <OpenOperation run={run} workflow={workflow} />
        <RouterLink to={workflowPath(run.documentId, run.workflowId, 'loom', { run: String(run.number), step: stopped?.stepId })} className="wfr-action">
          Back to workflow
        </RouterLink>
      </div>
    </section>
  );
}

/** The verdict sentence; a run ended early by an onSuccess end says which criterion held and what it spared. */
function explanationOf(run: WorkflowRun, workflow?: Workflow): string {
  const stopped = stoppedStep(run);
  if (run.status !== 'SUCCESS' || !stopped) return verdictExplanation(run);
  const action = workflow?.steps.find((s) => s.stepId === stopped.stepId)?.onSuccess.find((a) => a.type === 'end');
  const held = action?.criteria?.map((c) => c.condition).join(' and ');
  const name = run.workflowId === 'restock-pastry' ? run.outputs['pastryName'] : undefined;
  return `${stopped.stepId}'s onSuccess end applied${held ? `: ${held} held` : ''}${typeof name === 'string' ? `, so ${name} needs no restock` : ''}. The run ended with SUCCESS; its outputs come from the steps it reached.`;
}

/** "Open operation PATCH /pastries/{name}": the operation of the step where the run stopped (else the last that ran). */
function OpenOperation({ run, workflow }: { run: WorkflowRun; workflow?: Workflow }) {
  const step = stoppedStep(run) ?? [...run.steps].reverse().find((s) => s.status !== 'not-run');
  const def = workflow?.steps.find((s) => s.stepId === step?.stepId);
  if (!def) return null;
  return (
    <RouterLink to="/services/pastry2" className="wfr-action">
      Open operation
      <span className="wfr-action-op">
        {def.method} {def.path}
      </span>
    </RouterLink>
  );
}

/** "apiPastry · /rest/API+Pastry/2.0": the mock endpoint of each source a mocks run calls. */
function mockSources(run: WorkflowRun): string {
  return [...new Set(run.steps.flatMap((s) => (s.request ? [s.request.url] : [])))]
    .map((u) => u.match(/^https?:\/\/[^/]+(\/rest\/[^/]+\/[^/]+)/)?.[1])
    .filter((x, i, all): x is string => !!x && all.indexOf(x) === i)
    .map((p) => `apiPastry · ${p}`)
    .join(' · ');
}

/** Upper bar = success criteria, lower bar = schema validation, one column per step. */
function StepsBand({ run }: { run: WorkflowRun }) {
  const band = run.steps.map((s) => {
    const notRun = s.status === 'not-run';
    const criteriaOk = s.criteria.every((c) => c.held);
    const schema = s.schema.state;
    const word = notRun
      ? 'not run'
      : `${criteriaOk ? 'criteria held' : 'criteria failed'} · ${schema === 'pass' ? 'schema passed' : schema === 'fail' ? 'schema failed' : schema === 'na' ? 'schema n/a' : 'schema off'}`;
    return { id: s.stepId, status: s.status, word, criteria: notRun ? 'none' : criteriaOk ? 'pass' : 'fail', schema: notRun ? 'none' : schema };
  });
  return (
    <div className="wfr-band-wrap">
      <span className="wfr-band-legend">Steps band · upper bar = success criteria, lower bar = schema validation</span>
      <div className="wfr-band" role="img" aria-label={`Steps band: ${band.map((b) => `${b.id} ${b.word}`).join('; ')}`}>
        {band.map((b) => (
          <div key={b.id} className="wfr-band-step" data-status={b.status}>
            <span className="wfr-band-bar" data-part="criteria" data-state={b.criteria} />
            <span className="wfr-band-bar" data-part="schema" data-state={b.schema} />
            <span className="wfr-band-id">
              <Icon
                name={b.status === 'passed' ? 'check' : b.status === 'failed' ? 'cross' : 'circle'}
                size={12}
                strokeWidth={b.status === 'not-run' ? 2 : 2.8}
                strokeDasharray={b.status === 'not-run' ? '3 3' : undefined}
              />
              <span className="wfr-mono">{b.id}</span>
            </span>
            <span className="wfr-band-word">{b.word}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------------- example judging */

function ExampleJudging({ run, example, pending }: { run: WorkflowRun; example: WorkflowExample; pending: boolean }) {
  const judged = judgeExample(run, example);
  // While the run plays, the expectations wait for its end: every row is "Pending".
  const rows = pending ? judged.rows.map((r) => ({ ...r, got: '…' })) : judged.rows;
  const unmet = pending ? [] : judged.unmet;
  const matches = judged.matches;
  return (
    <section aria-labelledby="wfr-ex-h" className="wfr-card wfr-example" data-result={pending ? 'pending' : matches ? 'passed' : 'failed'}>
      <div className="wfr-example-head">
        <h2 id="wfr-ex-h" className="wfr-example-title">
          Example <span className="wfr-example-name">{example.id}</span>
        </h2>
        <span role="status">
          {pending ? (
            <Verdict tone="muted" icon="running" size={14}>
              Judged once the run ends
            </Verdict>
          ) : (
            <Verdict tone={matches ? 'success' : 'danger'} icon={matches ? 'check' : 'cross'} size={14}>
              {matches ? 'Matches the example' : 'Does not match the example'}
            </Verdict>
          )}
        </span>
      </div>
      <div className="wfr-table-wrap">
        <table className="wfr-table" data-min="560">
          <caption className="sr-only">Expectations of the example {example.id}</caption>
          <thead>
            <tr>
              <th scope="col">Expectation</th>
              <th scope="col">Expected</th>
              <th scope="col">This run</th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} data-met={pending || r.met ? undefined : 'false'}>
                <th scope="row" className="wfr-example-kind">
                  {r.kind}
                </th>
                <td className="wfr-mono-sm">{r.expected}</td>
                <td className="wfr-mono-sm" data-tone={pending ? 'muted' : r.met ? undefined : 'danger'}>
                  {r.got}
                </td>
                <td>
                  {pending ? (
                    <Verdict tone="muted" icon="dash">
                      Pending
                    </Verdict>
                  ) : (
                    <Verdict tone={r.met ? 'success' : 'danger'} icon={r.met ? 'check' : 'cross'}>
                      {r.met ? 'Met' : 'Not met'}
                    </Verdict>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {unmet.length > 0 ? (
        <ul aria-label="Unmet expectations" className="wfr-unmet">
          {unmet.map((u) => (
            <li key={u}>{u}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

/* ---------------------------------------------------------------------------------- properties */

function Properties({ run, detail, example }: { run: WorkflowRun; detail?: Detail; example?: WorkflowExample }) {
  const onMocks = run.target.kind === 'mocks';
  const firstBaggage = run.steps.find((s) => s.status !== 'not-run')?.baggage;
  const outputs = Object.entries(run.outputs);
  const verdict = example ? (run.status === 'RUNNING' ? 'Judged once the run ends' : judgeExample(run, example).matches ? 'Matches' : 'Does not match') : undefined;
  const rows: { term: string; value: React.ReactNode }[] = [
    {
      term: 'Workflow',
      value: (
        <>
          <RouterLink to={workflowPath(run.documentId, run.workflowId)} className="wfr-link-mono">
            {run.workflowId}
          </RouterLink>{' '}
          in {detail ? `${detail.document.title} ${detail.document.version}` : run.documentId}
        </>
      ),
    },
    {
      term: 'Target',
      value: (
        <span className="wfr-target">
          <strong>{run.target.kind === 'mocks' ? 'Microcks mocks' : run.target.kind === 'implementations' ? 'Implementations' : 'Mixed'}</strong>
          {run.target.kind === 'implementations' ? <span className="wfr-target-url">{implementationsText(run.target.baseUrls)}</span> : null}
          {run.target.kind === 'mocks' ? <span className="wfr-target-url">{mockSources(run)}</span> : null}
          {run.target.kind === 'mixed' ? <span className="wfr-proposed">Proposed · beyond POC</span> : null}
        </span>
      ),
    },
    { term: 'Secret', value: <span className="wfr-mono-sm">{!onMocks && run.options.secret ? run.options.secret : 'None'}</span> },
    {
      term: 'Inputs',
      value: (
        <span className="wfr-mono-sm">
          {Object.entries(run.options.inputs)
            .map(([k, v]) => `${k} = ${String(v)}`)
            .join(' · ') || 'none'}
        </span>
      ),
    },
    { term: 'Schema validation', value: run.options.validateSchemas ? 'On' : 'Off' },
    { term: 'Timeout per step', value: <span className="wfr-mono-sm">{run.options.timeoutMs} ms</span> },
    ...(onMocks && firstBaggage
      ? [
          {
            term: 'Baggage',
            value: (
              <span className="wfr-baggage-block">
                <code className="wfr-baggage">{firstBaggage}</code>
                <span className="wfr-note">Carried by each call to the mocks: Live traces show which run, step and attempt a mock call comes from.</span>
                <RouterLink to={`/traces?run=${run.id}`} className="wfr-link">
                  See in Live traces
                </RouterLink>
              </span>
            ),
          },
        ]
      : []),
    ...(outputs.length > 0 ? [{ term: 'Outputs', value: <span className="wfr-mono-sm">{outputs.map(([k, v]) => `${k} = ${J(v)}`).join(' · ')}</span> }] : []),
    ...(run.options.example
      ? [
          {
            term: 'Example',
            value: (
              <>
                <span className="wfr-mono-sm">{run.options.example}</span>
                {verdict ? ` · ${verdict}` : ''}
              </>
            ),
          },
        ]
      : []),
    { term: 'Origin', value: originText(run) },
  ];
  return (
    <section aria-labelledby="wfr-props-h" className="wfr-card wfr-props">
      <h2 id="wfr-props-h" className="wfr-card-title">
        Properties
      </h2>
      <dl className="run-facts" data-layout="inline">
        {rows.map((r) => (
          <div key={r.term} className="run-facts-row">
            <dt>{r.term}</dt>
            <dd>{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function originText(run: WorkflowRun): string {
  if (run.origin.kind === 'session') return `Session ${run.origin.sessionId}`;
  if (run.origin.kind === 'ui') return 'UI · Run workflow';
  if (run.origin.kind === 'api') return 'API';
  return 'Mock URL';
}
