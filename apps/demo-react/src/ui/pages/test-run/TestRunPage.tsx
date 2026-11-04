/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code and log regions must be reachable by keyboard (WCAG 2.1.1) */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import { formatClock } from '@/domain/shared';
import {
  buildContractDiff,
  buildRunnerLog,
  ciCommandForRun,
  elapsedMs,
  type DiffRow,
  type TestRun,
  type TestStepResult,
} from '@/domain/testing';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { ConformanceBand, type OperationResult } from '@/ui/components/ui/conformance-band';
import { CiPanel } from '@/ui/components/ui/ci-panel';
import { TEST_RESULT_WORD } from '@/ui/app/outcomes';
import { useReplay } from '@/ui/app/use-replay';
import { Icon } from '@/ui/components/ui/icon';
import { StatusBadge, type Outcome } from '@/ui/components/ui/status-badge';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { RunProgress, type RunSegment } from '@/ui/components/ui/run-progress';
import { RunnerLog } from '@/ui/components/ui/runner-log';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { useThrottledAnnounce } from '../tests/useThrottledAnnounce';
import './test-run.css';

/** The run "executes" one step every 1.3 s, as in the prototype. */
const STEP_MS = 1300;
/** A live run opens with 3 steps already finished (the prototype's baseline). */
const LIVE_START = 3;

type StepState = 'pass' | 'fail' | 'run' | 'pend';
const LOOK: Record<StepState, { word: string; status: Outcome }> = {
  pass: { word: 'Passed', status: 'conformant' },
  fail: { word: 'Failed', status: 'failed' },
  run: { word: 'Running', status: 'running' },
  pend: { word: 'Queued', status: 'never' },
};
const SEGMENT: Record<StepState, RunSegment> = { pass: 'done', fail: 'failed', run: 'current', pend: 'queued' };

export default function TestRunPage() {
  const { testRunId = '' } = useParams();
  usePageTitle(`Test run #${testRunId} · Microcks`);
  const uc = useUseCases();
  const query = useQuery(() => uc.testing.get(testRunId), [testRunId]);
  const base = query.data;

  if (base) return <RunView key={base.id} base={base} />;
  return (
    <>
      <PageHeader title={`Run #${testRunId}`} breadcrumb={[{ label: 'Tests', to: '/tests' }, { label: `Run #${testRunId}` }]} />
      {query.status === 'loading' ? <LoadingBlock label="the test run" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="Test run" onRetry={query.reload} /> : null}
    </>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
function basePath(url: string): string {
  try {
    const p = new URL(url).pathname;
    return p === '/' ? '' : p.replace(/\/$/, '');
  } catch {
    return '';
  }
}

function RunView({ base }: { base: TestRun }) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const throttled = useThrottledAnnounce(2000);
  const form = useQuery(() => uc.testing.getCreateForm(base.serviceId), [base.serviceId]);
  const timeline = useQuery(() => uc.testing.timeline(base.serviceId), [base.serviceId]);
  const total = base.steps.length;
  const [play, setPlay] = useState<{ phase: 'running' | 'done'; tick: number }>(
    base.live ? { phase: 'running', tick: Math.min(LIVE_START, total) } : { phase: 'done', tick: total },
  );
  const { phase, tick } = play;
  /** `null` follows the run (latest finished step while running, the first failed one when done); '' = all closed. */
  const [sel, setSel] = useState<string | null>(null);
  const [ciOpen, setCiOpen] = useState(false);
  /** The control the user pressed disappears when the run ends (Skip to result, Step forward): focus then moves to the verdict. */
  const focusVerdict = useRef(false);
  const verdictRef = useRef<HTMLElement>(null);
  const running = phase === 'running';
  const done = !running;
  const finished = done ? total : tick;

  /** One step further; after the last step the run computes its verdict. */
  const advance = useCallback(
    () => setPlay((p) => (p.phase !== 'running' ? p : p.tick >= total ? { phase: 'done', tick: total } : { phase: 'running', tick: p.tick + 1 })),
    [total],
  );
  useReplay(running, advance, STEP_MS);

  const replay = () => {
    setPlay({ phase: 'running', tick: 0 });
    setSel(null);
    setCiOpen(false);
  };
  useEffect(() => {
    if (phase === 'done' && focusVerdict.current) {
      focusVerdict.current = false;
      verdictRef.current?.focus();
    }
  }, [phase]);
  const stepForward = () => {
    if (tick >= total) focusVerdict.current = true;
    advance();
  };
  const skip = () => {
    focusVerdict.current = true;
    setPlay({ phase: 'done', tick: total });
    setSel(null);
  };

  const service = form.data?.services.find((s) => s.id === base.serviceId);
  const serviceLabel = service ? `${service.name} ${service.version}` : base.serviceId;

  const stateOf = (i: number): StepState => {
    const s = base.steps[i];
    if (i < finished && s) return s.result === 'passed' ? 'pass' : 'fail';
    return i === tick && running ? 'run' : 'pend';
  };
  const states = base.steps.map((_, i) => stateOf(i));
  const passCount = states.filter((s) => s === 'pass').length;
  const failCount = states.filter((s) => s === 'fail').length;
  const queuedCount = total - passCount - failCount;

  // Announce progress (throttled) and the verdict.
  const previousProgress = useRef({ finished, done });
  useEffect(() => {
    const prev = previousProgress.current;
    previousProgress.current = { finished, done };
    if (done && !prev.done) {
      announce(`Test run #${base.id} ${TEST_RESULT_WORD[base.result].toLowerCase()}: ${passCount} of ${total} steps passed.`);
    } else if (!done && finished > prev.finished) {
      const step = base.steps[finished - 1];
      if (step) throttled(`Step ${finished} of ${total}: ${step.name} ${step.result}.`);
    }
  }, [finished, done, base, total, passCount, announce, throttled]);

  const operations = useMemo(() => {
    const labels = base.operationLabels ?? [];
    const ids = labels.length > 0 ? labels.map((l) => l.id) : [...new Set(base.steps.map((s) => s.operationId))];
    return ids.map((id) => {
      const label = labels.find((l) => l.id === id);
      const first = base.steps.find((s) => s.operationId === id);
      const idx = base.steps.flatMap((s, i) => (s.operationId === id ? [i] : []));
      return { id, method: label?.method ?? first?.method ?? 'GET', path: label?.path ?? first?.path ?? id, idx };
    });
  }, [base]);
  const opStates = operations.map((op): StepState => {
    const st = op.idx.map((i) => states[i]);
    const fin = st.filter((s) => s === 'pass' || s === 'fail').length;
    if (fin === st.length) return st.includes('fail') ? 'fail' : 'pass';
    return st.includes('run') || fin > 0 ? 'run' : 'pend';
  });

  const firstFailed = base.steps.find((s) => s.result === 'failed');
  const autoSel = done ? (firstFailed ?? base.steps[total - 1])?.id : base.steps[tick - 1]?.id;
  const selId = sel === null ? autoSel : sel;

  const log = buildRunnerLog({ ...base, result: done ? base.result : 'running' }, finished, done);
  const elapsed = elapsedMs(base, finished);
  const score = Math.round((100 * passCount) / Math.max(1, total));
  const waitSec = Math.round(base.timeoutMs / 1000);
  const apiRef = service ? `${service.name}:${service.version}` : base.serviceId;
  const ci = ciCommandForRun(apiRef, base.endpoint, base.runner, waitSec);
  const current = running ? base.steps[tick] : undefined;
  const prefix = basePath(base.endpoint);

  const points = timeline.data ?? [];
  const at = points.findIndex((p) => p.runId === base.id);
  const previous = at > 0 ? points[at - 1] : undefined;
  const delta = previous ? score - previous.conformance : 0;

  const brokenOps = operations.filter((_, i) => opStates[i] === 'fail');
  const failedSchema = firstFailed?.schemaRef?.split('/').pop();
  const bandOutcomes: OperationResult[] = opStates.map((s) => (s === 'pass' ? 'pass' : s === 'fail' ? 'fail' : 'untested'));
  const related = base.relatedWorkflowRun;

  const badges = (
    <span className="tr-badges">
      <RouterLink to={`/services/${base.serviceId}`} className="tr-badge-link">
        <ApiBadge protocol={service?.protocol ?? 'REST'} name={serviceLabel} size="lg" />
      </RouterLink>
      {running ? (
        <>
          <LiveIndicator />
          <StatusBadge shape="bare" status="running" label={`Running · step ${Math.min(tick + 1, total)} of ${total}`} />
        </>
      ) : (
        <ApiBadge label="result" value={TEST_RESULT_WORD[base.result].toLowerCase()} status={base.result === 'passed' ? 'success' : base.result === 'failed' ? 'danger' : 'warning'} />
      )}
    </span>
  );

  return (
    <>
      <PageHeader
        title={`Run #${base.id}`}
        breadcrumb={[
          { label: 'APIs & Services', to: '/services' },
          { label: serviceLabel, to: `/services/${base.serviceId}` },
          { label: 'Tests', to: `/tests/service/${base.serviceId}` },
          { label: `Run #${base.id}` },
        ]}
        badge={badges}
        align="start"
        description={
          <span className="tr-meta">
            <span>
              <span className="tr-meta-key">Endpoint</span>
              <span className="tr-meta-endpoint">{base.endpoint}</span>
            </span>
            <span>
              <span className="tr-meta-key">Runner</span>
              <span className="tr-meta-runner">{base.runner}</span>
            </span>
            <span>
              <span className="tr-meta-key">Started</span>
              <span>{relative(base.startedAt)}</span>
              <span className="tr-meta-date">{formatClock(base.startedAt)}</span>
            </span>
            <span>
              <span className="tr-meta-key">{done ? 'Duration' : 'Elapsed'}</span>
              <span className="tr-meta-mono">{elapsed} ms</span>
            </span>
            <span>
              <span className="tr-meta-key">Timeout</span>
              <span className="tr-meta-mono">{waitSec} s</span>
            </span>
            {base.launchedBy ? (
              <span>
                <span className="tr-meta-key">Launched by</span>
                <span>{base.launchedBy}</span>
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <Button icon="reset" onClick={replay}>
              Replay run
            </Button>
            {running ? (
              <Button variant="primary" icon="skip" onClick={skip}>
                Skip to result
              </Button>
            ) : null}
          </>
        }
      />

      <div className="tr-top">
        {running ? (
          <RunProgress
            className="tr-card"
            done={finished}
            total={total}
            caption="test steps done"
            nowLabel="Now calling"
            now={current ? `${current.method} ${base.endpoint}${current.path}` : 'Computing conformance score…'}
            segments={states.map((st) => SEGMENT[st])}
            counts={[
              { kind: 'pass', text: `${passCount} passed` },
              { kind: 'fail', text: `${failCount} failed` },
              { kind: 'pending', text: `${queuedCount} queued` },
            ]}
            action={
              <Button size="sm" icon="chevron" className="tr-step-forward" onClick={stepForward}>
                Step forward
              </Button>
            }
            note="Microcks replays every example of the contract against the endpoint, then validates each response body with the OpenAPI schema of the operation."
          />
        ) : (
          <section aria-label="Verdict" className="tr-verdict" ref={verdictRef} tabIndex={-1}>
            <div className="tr-verdict-head">
              <div className="tr-score">
                <span className="tr-score-label">Conformance score</span>
                <span className="tr-score-value" data-level={score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low'}>
                  {score}%
                </span>
                {previous ? (
                  <span className="tr-trend" data-dir={delta < 0 ? 'down' : delta > 0 ? 'up' : 'flat'}>
                    <Icon name={delta < 0 ? 'arrow-down' : delta > 0 ? 'arrow-up' : 'dash'} size={13} />
                    {delta === 0 ? 'Same as' : `${Math.abs(delta)} pts vs`} run #{previous.runId} <span className="tr-trend-prev">{previous.conformance}%</span>
                  </span>
                ) : null}
              </div>
              <div className="tr-verdict-text">
                <span className="tr-verdict-word" data-result={base.result}>
                  <Icon name={base.result === 'passed' ? 'check' : base.result === 'failed' ? 'cross' : 'clock'} size={18} />
                  {base.result === 'passed' ? 'Passed' : base.result === 'failed' ? 'Failed' : 'Timed out'}
                </span>
                <span className="tr-verdict-summary">
                  <span className="tr-mono-strong">
                    {passCount}/{total}
                  </span>{' '}
                  test steps passed ·{' '}
                  {brokenOps.length === 0
                    ? `all ${operations.length} operations match their contract`
                    : `${brokenOps.length} of ${operations.length} operations broke ${brokenOps.length === 1 ? 'its' : 'their'} contract`}
                </span>
                {brokenOps[0] && base.result === 'failed' && failedSchema ? (
                  <span className="tr-verdict-detail">
                    <span className="tr-mono">
                      {brokenOps[0].method} {brokenOps[0].path}
                    </span>{' '}
                    returns a body that does not match the <span className="tr-mono">{failedSchema}</span> schema.
                  </span>
                ) : base.reason ? (
                  <span className="tr-verdict-detail">{base.reason}</span>
                ) : null}
                {related ? (
                  <RouterLink to={`/workflows/runs/${related.runId}`} className="tr-verdict-link">
                    <Icon name="dispatcher" size={14} />
                    <span>
                      Same contract violation breaks workflow <strong>{related.workflowTitle}</strong> (run #{related.number}, schema validation) at step{' '}
                      <span className="tr-mono">{related.stepId}</span>
                    </span>
                  </RouterLink>
                ) : null}
              </div>
            </div>

            <div className="tr-band">
              <span className="tr-band-caption">Conformance band · one cell per operation</span>
              <ConformanceBand
                outcomes={bandOutcomes}
                labels={operations.map((op, i) => `${op.method} ${op.path} · ${LOOK[opStates[i] ?? 'pend'].word.toLowerCase()}`)}
              />
            </div>

            <div className="tr-actions">
              <Button asChild variant="primary" icon="play">
                <RouterLink to={`/tests/create?service=${base.serviceId}`}>Run again</RouterLink>
              </Button>
              <Button asChild>
                <RouterLink to={`/tests/service/${base.serviceId}`}>All runs</RouterLink>
              </Button>
              <Button asChild>
                <RouterLink to={`/services/${base.serviceId}`}>Back to service</RouterLink>
              </Button>
              <Button icon="code" className="ci-panel-toggle" aria-expanded={ciOpen} aria-controls="ci-panel" onClick={() => setCiOpen(!ciOpen)}>
                Add to CI
              </Button>
            </div>

            {ciOpen ? (
              <CiPanel
                id="ci-panel"
                title="Run this test in your pipeline"
                hint="Same service, endpoint and runner. The command exits non-zero when the test fails, so a contract break stops the build."
                command={ci}
                copyLabel="Copy command"
                footnote={
                  <>
                    Set <span className="tr-mono">MICROCKS_CLIENT_SECRET</span> from the <span className="tr-mono">microcks-serviceaccount</span> credentials. The
                    same parameters work with the GitHub Action, GitLab CI, Jenkins and Tekton integrations.
                  </>
                }
              />
            ) : null}
          </section>
        )}

        <RunnerLog
          className="tr-log"
          status={running ? <LiveIndicator variant="inline" label="live · streaming" /> : `${log.length} lines · completed`}
          lines={log.map((l) => ({ time: l.time, level: l.level, text: l.message, emphasis: l.tone === 'emphasis', error: l.tone === 'error' }))}
        />
      </div>

      <section aria-labelledby="tr-results-title" className="tr-results">
        <div className="tr-results-head">
          <h2 id="tr-results-title" className="tr-results-title">
            Results
          </h2>
          <span className="tr-results-hint">
            {operations.length} operations · {total} test steps · select a finished step to compare the contract with the actual response
          </span>
        </div>

        {operations.map((op, oi) => {
          const opState = opStates[oi] ?? 'pend';
          const fin = op.idx.filter((i) => i < finished);
          const ms = fin.reduce((n, i) => n + (base.steps[i]?.ms ?? 0), 0);
          return (
            <div key={op.id} className="tr-op" data-state={opState}>
              <div className="tr-op-head">
                <MethodTag method={op.method} className="tr-op-method" />
                <h3 className="tr-op-path">{op.path}</h3>
                <span className="tr-op-count">
                  {op.idx.length} {op.idx.length === 1 ? 'step' : 'steps'}
                  {fin.length > 0 && fin.length < op.idx.length ? ` · ${fin.length} done` : ''}
                </span>
                <span className="tr-op-segs" aria-hidden="true">
                  {op.idx.map((i) => (
                    <span key={i} data-state={states[i]} />
                  ))}
                </span>
                <StatusBadge shape="bare" status={LOOK[opState].status} label={LOOK[opState].word} className="tr-state" />
                <span className="tr-op-ms">{fin.length ? `${ms} ms` : '—'}</span>
              </div>

              {op.idx.map((i) => {
                const step = base.steps[i];
                if (!step) return null;
                const st = states[i] ?? 'pend';
                const isFin = st === 'pass' || st === 'fail';
                const open = isFin && selId === step.id;
                const regionId = `tr-diff-${step.id}`;
                return (
                  <div key={step.id} className="tr-step">
                    <button
                      type="button"
                      className="tr-step-row"
                      data-state={st}
                      aria-expanded={open}
                      aria-controls={open ? regionId : undefined}
                      aria-disabled={!isFin}
                      onClick={() => {
                        if (isFin) setSel(open ? '' : step.id);
                      }}
                    >
                      <span className="tr-step-name">{step.name}</span>
                      <span className="tr-step-req">
                        {step.method} {prefix}
                        {step.path}
                        {step.requestBody ? `  ${step.requestBody}` : ''}
                      </span>
                      <span className="tr-step-code" data-fin={isFin ? '' : undefined}>
                        {isFin ? (step.httpStatus ?? 200) : '—'}
                      </span>
                      <span className="tr-step-ms">{isFin ? `${step.ms} ms` : '—'}</span>
                      <StatusBadge shape="bare" status={LOOK[st].status} label={LOOK[st].word} className="tr-state" />
                      <span className="tr-step-chevron" aria-hidden="true">
                        {isFin ? <Icon name="chevron" size={16} /> : null}
                      </span>
                    </button>
                    {open ? <StepDiff id={regionId} step={step} run={base} serviceId={base.serviceId} /> : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>
    </>
  );
}

function CodeCard({ title, source, rows, label, bad }: { title: string; source: string; rows: DiffRow[]; label: string; bad?: boolean }) {
  return (
    <div className="tr-code-card" data-bad={bad ? '' : undefined}>
      <div className="tr-code-head">
        <span className="tr-code-title">{title}</span>
        <span className="tr-code-source">{source}</span>
      </div>
      <pre className="tr-code" tabIndex={0} aria-label={label}>
        <code>
          {rows.map((r) => (
            <span key={r.n} className="tr-line" data-bad={r.bad ? '' : undefined}>
              <span className="tr-line-n" aria-hidden="true">
                {r.n}
              </span>
              <span className="tr-line-mark">{r.bad ? <><span aria-hidden="true">✕</span><span className="sr-only">Mismatch: </span></> : null}</span>
              <span className="tr-line-text">{r.text}</span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function StepDiff({ id, step, run, serviceId }: { id: string; step: TestStepResult; run: TestRun; serviceId: string }) {
  const diff = buildContractDiff(step);
  const ko = step.result === 'failed';
  const isArray = Array.isArray(step.payload);
  const n = isArray ? (step.payload as unknown[]).length : 1;
  const code = step.httpStatus ?? 200;
  const schema = step.schemaRef?.split('/').pop() ?? 'the schema';
  const props = step.contract?.length ?? 0;
  const newEnum = step.violations.map((v) => /^Enum value "([^"]+)"/.exec(v.message)?.[1]).find(Boolean);
  const label = run.operationLabels?.find((o) => o.id === step.operationId);
  const opText = label ? `${label.method} ${label.path}` : `${step.method} ${step.path}`;
  return (
    <div id={id} role="region" aria-label={`Contract versus actual response for ${step.name}`} className="tr-diff">
      <div className="tr-diff-head">
        <div className="tr-diff-heading">
          <h4 className="tr-diff-title">
            Contract <span aria-hidden="true" className="tr-diff-swap">⇄</span> Actual response
          </h4>
          {step.schemaRef ? (
            <span className="tr-diff-ref">
              {isArray ? 'array of ' : ''}
              {step.schemaRef} · {code} application/json
            </span>
          ) : null}
        </div>
        <ApiBadge
          label="schema"
          value={ko ? `${step.violations.length} ${step.violations.length === 1 ? 'violation' : 'violations'}` : 'Conformant'}
          status={ko ? 'danger' : 'success'}
        />
      </div>

      <div className="tr-request">
        <span>
          <span className="tr-request-key">sent </span>
          <span>
            {step.method} {run.endpoint}
            {step.path}
          </span>
        </span>
        {step.requestBody ? (
          <span>
            <span className="tr-request-key">body </span>
            <span className="tr-request-body">{step.requestBody}</span>
          </span>
        ) : null}
        <span>
          <span className="tr-request-key">got </span>
          <span>
            {code} OK · application/json · {step.ms} ms
          </span>
        </span>
      </div>

      {step.contract ? (
        <div className="tr-code-pair">
          <CodeCard title="Contract · expected" source={run.contractFile ?? 'contract'} rows={diff.left} label="Contract schema" />
          <div aria-hidden="true" className="tr-code-swap">
            ⇄
          </div>
          <CodeCard title="Actual response" source={hostOf(run.endpoint)} rows={diff.right} label="Actual response" bad={ko} />
        </div>
      ) : null}

      {ko ? (
        <div className="tr-violations">
          <ul className="tr-violation-list">
            {step.violations.map((v) => (
              <li key={v.path} className="tr-violation">
                <span aria-hidden="true" className="tr-violation-mark">
                  ✕
                </span>
                <span className="tr-violation-body">
                  <span className="tr-violation-text">
                    <span className="tr-violation-path">{v.path}</span> {v.message}
                  </span>
                  {v.raw ? <span className="tr-violation-raw">validator: {v.raw}</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="tr-diff-note">
            The endpoint answered <span className="tr-mono">{code}</span> as the contract declares, but its body breaks the <span className="tr-mono">{schema}</span>{' '}
            schema on {step.violations.length} {step.violations.length === 1 ? 'property' : 'properties'}. Fix the implementation
            {newEnum ? (
              <>
                , or if <span className="tr-mono">{newEnum}</span> is an intended new status, add it to the contract and re-import
              </>
            ) : null}
            .{' '}
            <RouterLink to={`/services/${serviceId}/operations/${step.operationId}`} className="tr-diff-link">
              Open {opText}
            </RouterLink>
          </p>
        </div>
      ) : (
        <p className="tr-diff-ok">
          <Icon name="check" size={14} />
          <span>
            {isArray
              ? `Conformant. ${n} ${n === 1 ? 'item' : 'items'} checked against ${schema}, ${props} properties each, 0 violations. Status ${code} is declared by the contract.`
              : `Conformant. ${props} properties checked against ${schema}, 0 violations. Status ${code} is declared by the contract.`}
          </span>
        </p>
      )}
    </div>
  );
}
