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
import { ApiBadge, Button, ConformanceBand, CiPanel, Icon, StatusBadge, LiveIndicator, MethodTag, RunProgress, RunnerLog, SectionLabel } from '@microcks/deep-ink';
import { TEST_RESULT_WORD } from '@/ui/app/outcomes';
import { useReplay } from '@/ui/app/use-replay';
import { ErrorBlock, LoadingBlock } from '@/ui/app/states';
import { useThrottledAnnounce } from '../tests/useThrottledAnnounce';
import {
  STEP_LOOK,
  STEP_MS,
  STEP_SEGMENT,
  basePath,
  conformantSentence,
  failedSchemaName,
  hostOf,
  initialReplay,
  newEnumValue,
  nowCalling,
  operationBandLabels,
  operationOutcomes,
  operationStates,
  operationsSummary,
  previousPoint,
  progressCounts,
  resultStatus,
  runOperations,
  runScore,
  runnerLogLines,
  runningLabel,
  schemaBadgeValue,
  scoreLevel,
  selectedStepId,
  stepAnnouncement,
  stepCounts,
  stepOperationText,
  stepSchemaName,
  stepStates,
  trendDir,
  trendIcon,
  trendText,
  verdictAnnouncement,
  verdictIcon,
  verdictWord,
} from './run';
import '@microcks/demo-styles/pages/test-run/test-run.css';

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

function RunView({ base }: { base: TestRun }) {
  const uc = useUseCases();
  const relative = useRelativeTime();
  const announce = useAnnounce();
  const throttled = useThrottledAnnounce(2000);
  const form = useQuery(() => uc.testing.getCreateForm(base.serviceId), [base.serviceId]);
  const timeline = useQuery(() => uc.testing.timeline(base.serviceId), [base.serviceId]);
  const total = base.steps.length;
  const [play, setPlay] = useState(initialReplay(base));
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

  const states = stepStates(base, finished, tick, running);
  const { pass: passCount, fail: failCount, queued: queuedCount } = stepCounts(states);

  // Announce progress (throttled) and the verdict.
  const previousProgress = useRef({ finished, done });
  useEffect(() => {
    const prev = previousProgress.current;
    previousProgress.current = { finished, done };
    if (done && !prev.done) {
      announce(verdictAnnouncement(base, passCount, total));
    } else if (!done && finished > prev.finished) {
      const step = base.steps[finished - 1];
      if (step) throttled(stepAnnouncement(finished, total, step));
    }
  }, [finished, done, base, total, passCount, announce, throttled]);

  const operations = useMemo(() => runOperations(base), [base]);
  const opStates = operationStates(operations, states);

  const selId = selectedStepId(base, done, tick, sel);

  const log = buildRunnerLog({ ...base, result: done ? base.result : 'running' }, finished, done);
  const elapsed = elapsedMs(base, finished);
  const score = runScore(passCount, total);
  const waitSec = Math.round(base.timeoutMs / 1000);
  const apiRef = service ? `${service.name}:${service.version}` : base.serviceId;
  const ci = ciCommandForRun(apiRef, base.endpoint, base.runner, waitSec);
  const current = running ? base.steps[tick] : undefined;
  const prefix = basePath(base.endpoint);

  const previous = previousPoint(timeline.data ?? [], base.id);
  const delta = previous ? score - previous.conformance : 0;

  const brokenOps = operations.filter((_, i) => opStates[i] === 'fail');
  const failedSchema = failedSchemaName(base);
  const bandOutcomes = operationOutcomes(opStates);
  const related = base.relatedWorkflowRun;

  const badges = (
    <span className="tr-badges">
      <RouterLink to={`/services/${base.serviceId}`} className="tr-badge-link">
        <ApiBadge protocol={service?.protocol ?? 'REST'} name={serviceLabel} size="lg" />
      </RouterLink>
      {running ? (
        <>
          <LiveIndicator />
          <StatusBadge shape="bare" status="running" label={runningLabel(tick, total)} />
        </>
      ) : (
        <ApiBadge label="result" value={TEST_RESULT_WORD[base.result].toLowerCase()} status={resultStatus(base.result)} />
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
              <span className="demo-mono">{elapsed} ms</span>
            </span>
            <span>
              <span className="tr-meta-key">Timeout</span>
              <span className="demo-mono">{waitSec} s</span>
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
            now={nowCalling(current, base.endpoint)}
            segments={states.map((st) => STEP_SEGMENT[st])}
            counts={progressCounts({ pass: passCount, fail: failCount, queued: queuedCount })}
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
                <SectionLabel lineHeight="normal">Conformance score</SectionLabel>
                <span className="tr-score-value" data-level={scoreLevel(score)}>
                  {score}%
                </span>
                {previous ? (
                  <span className="tr-trend" data-dir={trendDir(delta)}>
                    <Icon name={trendIcon(delta)} size={13} strokeWidth={2.4} />
                    {trendText(delta)} run #{previous.runId} <span className="tr-trend-prev">{previous.conformance}%</span>
                  </span>
                ) : null}
              </div>
              <div className="tr-verdict-text">
                <span className="tr-verdict-word" data-result={base.result}>
                  <Icon name={verdictIcon(base.result)} size={18} strokeWidth={2.6} />
                  {verdictWord(base.result)}
                </span>
                <span className="tr-verdict-summary">
                  <span className="demo-mono-strong">
                    {passCount}/{total}
                  </span>{' '}
                  test steps passed ·{' '}
                  {operationsSummary(brokenOps.length, operations.length)}
                </span>
                {brokenOps[0] && base.result === 'failed' && failedSchema ? (
                  <span className="tr-verdict-detail">
                    <span className="demo-mono">
                      {brokenOps[0].method} {brokenOps[0].path}
                    </span>{' '}
                    returns a body that does not match the <span className="demo-mono">{failedSchema}</span> schema.
                  </span>
                ) : base.reason ? (
                  <span className="tr-verdict-detail">{base.reason}</span>
                ) : null}
                {related ? (
                  <RouterLink to={`/workflows/runs/${related.runId}`} className="tr-verdict-link">
                    <Icon name="dispatcher" size={14} />
                    <span>
                      Same contract violation breaks workflow <strong>{related.workflowTitle}</strong> (run #{related.number}, schema validation) at step{' '}
                      <span className="demo-mono">{related.stepId}</span>
                    </span>
                  </RouterLink>
                ) : null}
              </div>
            </div>

            <div className="tr-band">
              <span className="tr-band-caption">Conformance band · one cell per operation</span>
              <ConformanceBand outcomes={bandOutcomes} labels={operationBandLabels(operations, opStates)} />
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
                    Set <span className="demo-mono">MICROCKS_CLIENT_SECRET</span> from the <span className="demo-mono">microcks-serviceaccount</span> credentials. The
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
          lines={runnerLogLines(log)}
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
                <StatusBadge shape="bare" status={STEP_LOOK[opState].status} label={STEP_LOOK[opState].word} className="tr-state" />
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
                      <StatusBadge shape="bare" status={STEP_LOOK[st].status} label={STEP_LOOK[st].word} className="tr-state" />
                      <span className="tr-step-chevron" aria-hidden="true">
                        {isFin ? <Icon name="chevron" size={16} className="tr-step-chevron-icon" /> : null}
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
        <SectionLabel lineHeight="normal">{title}</SectionLabel>
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
  const code = step.httpStatus ?? 200;
  const schema = stepSchemaName(step);
  const newEnum = newEnumValue(step);
  const opText = stepOperationText(run, step);
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
        <ApiBadge label="schema" value={schemaBadgeValue(step)} status={ko ? 'danger' : 'success'} />
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
            The endpoint answered <span className="demo-mono">{code}</span> as the contract declares, but its body breaks the <span className="demo-mono">{schema}</span>{' '}
            schema on {step.violations.length} {step.violations.length === 1 ? 'property' : 'properties'}. Fix the implementation
            {newEnum ? (
              <>
                , or if <span className="demo-mono">{newEnum}</span> is an intended new status, add it to the contract and re-import
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
          <Icon name="check" size={14} className="tr-diff-ok-icon" />
          <span>{conformantSentence(step)}</span>
        </p>
      )}
    </div>
  );
}
