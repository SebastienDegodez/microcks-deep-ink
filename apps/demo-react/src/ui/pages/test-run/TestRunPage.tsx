/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code and log regions must be reachable by keyboard (WCAG 2.1.1) */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router';
import {
  buildContractDiff,
  buildRunnerLog,
  ciCommandForRun,
  elapsedMs,
  operationLabel,
  runConformance,
  type TestRun,
  type TestStepResult,
} from '@/domain/testing';
import { PageHeader, useAnnounce, usePageTitle, useQuery, useSubscription, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { ConformanceBand, type OperationResult } from '@/ui/components/ui/conformance-band';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { Icon } from '@/ui/components/ui/icon';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Panel } from '@/ui/components/ui/panel';
import { Progress } from '@/ui/components/ui/progress';
import { StatusBadge, type Outcome } from '@/ui/components/ui/status-badge';
import { StepStatus } from '@/ui/components/ui/step-status';
import { Switch } from '@/ui/components/ui/switch';
import { ErrorBlock, LoadingBlock } from '../tests/PageStates';
import { useThrottledAnnounce } from '../tests/useThrottledAnnounce';
import './test-run.css';

const OUTCOME: Record<TestRun['result'], Outcome> = { passed: 'conformant', failed: 'failed', timeout: 'partial', running: 'running' };

export default function TestRunPage() {
  const { testRunId = '' } = useParams();
  usePageTitle(`Test run #${testRunId} · Microcks`);
  const uc = useUseCases();
  const query = useQuery(() => uc.testing.get(testRunId), [testRunId]);
  const base = query.data;

  return (
    <>
      <PageHeader
        title={`Test run #${testRunId}`}
        eyebrow="Tests"
        actions={
          base ? (
            <Button asChild variant="ghost">
              <RouterLink to={`/tests/service/${base.serviceId}`}>Test history</RouterLink>
            </Button>
          ) : undefined
        }
      />
      {query.status === 'loading' && !base ? <LoadingBlock label="the test run" /> : null}
      {query.status === 'error' ? <ErrorBlock error={query.error} what="Test run" onRetry={query.reload} /> : null}
      {base ? <RunView key={base.id} base={base} /> : null}
    </>
  );
}

function RunView({ base }: { base: TestRun }) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const throttled = useThrottledAnnounce(2000);
  const form = useQuery(() => uc.testing.getCreateForm(base.serviceId), [base.serviceId]);
  const stream = useSubscription<TestRun>(base.live ? (listener) => uc.testing.watch(base.id, listener) : undefined, [base.id, base.live]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [showCi, setShowCi] = useState(false);

  const streamed = stream.value;
  const run: TestRun = useMemo(
    () => (base.live ? (streamed ?? { ...base, steps: [], passed: 0, result: 'running' as const }) : base),
    [base, streamed],
  );
  const total = base.steps.length;
  const finished = run.steps.length;
  const running = run.result === 'running';
  const service = form.data?.services.find((s) => s.id === base.serviceId);

  const lastAnnounced = useRef(0);
  useEffect(() => {
    if (!base.live || finished === 0 || finished === lastAnnounced.current) return;
    lastAnnounced.current = finished;
    const step = run.steps[finished - 1];
    if (!step) return;
    if (finished === total && !running) {
      announce(`Test run #${run.id} ${run.result}: ${run.passed} of ${total} steps passed.`);
    } else {
      throttled(`Step ${finished} of ${total}: ${step.name} ${step.result}.`);
    }
  }, [finished, base.live, run, total, running, announce, throttled]);

  const operations = useMemo(() => {
    const labels = base.operationLabels ?? [];
    const ids = labels.length > 0 ? labels.map((l) => l.id) : [...new Set(base.steps.map((s) => s.operationId))];
    return ids.map((id) => {
      const label = labels.find((l) => l.id === id);
      const first = base.steps.find((s) => s.operationId === id);
      return {
        id,
        title: label ? operationLabel(label) : first ? `${first.method} ${first.path}` : id,
        method: label?.method ?? first?.method ?? 'GET',
        steps: run.steps.filter((s) => s.operationId === id),
      };
    });
  }, [base, run.steps]);

  const outcomes: OperationResult[] = operations.map((op) =>
    op.steps.length === 0 ? 'untested' : op.steps.some((s) => s.result === 'failed') ? 'fail' : 'pass',
  );

  const firstFailed = run.steps.find((s) => s.result === 'failed');
  const selected: TestStepResult | undefined = run.steps.find((s) => s.id === selectedId) ?? firstFailed;
  const diff = selected ? buildContractDiff(selected) : undefined;
  const log = buildRunnerLog(run, finished, !running);
  const conformance = runConformance({ passed: run.passed, total });
  const waitSec = Math.round(base.timeoutMs / 1000);
  const apiRef = service ? `${service.name}:${service.version}` : base.serviceId;
  const ci = ciCommandForRun(apiRef, base.endpoint, base.runner, waitSec);

  return (
    <div className="stack">
      <Panel title="Verdict" aria-busy={running}>
        <div className="tr-verdict">
          <div className="tr-verdict-main">
            <div className="demo-actions-row">
              <StatusBadge status={OUTCOME[run.result]} />
              {service ? <ApiBadge protocol={service.protocol} name={service.name} version={service.version} /> : null}
              {running ? <LiveIndicator paused={stream.paused} label="streaming" /> : null}
            </div>
            <p style={{ margin: 0 }}>
              <strong>{run.passed}</strong> of <strong>{total}</strong> steps passed · conformance <strong>{conformance}%</strong> · {elapsedMs(run, finished)} ms
            </p>
            <ul className="demo-meta">
              <li className="demo-meta-item"><span className="demo-meta-key">Runner</span> <span className="demo-mono">{base.runner}</span></li>
              <li className="demo-meta-item"><span className="demo-meta-key">Endpoint</span> <span className="demo-mono">{base.endpoint}</span></li>
              <li className="demo-meta-item"><span className="demo-meta-key">Environment</span> {base.environment}</li>
              {base.launchedBy ? <li className="demo-meta-item"><span className="demo-meta-key">Launched by</span> {base.launchedBy}</li> : null}
            </ul>
          </div>
          {running ? (
            <Button icon={stream.paused ? 'play' : 'pause'} onClick={stream.toggle}>
              {stream.paused ? 'Resume' : 'Pause'}
            </Button>
          ) : null}
        </div>
        <div style={{ marginBlockStart: 12 }}>
          <Progress label={`Test progress: ${finished} of ${total} steps`} value={finished} max={Math.max(total, 1)} />
        </div>
        <div style={{ marginBlockStart: 12 }}>
          <ConformanceBand outcomes={outcomes} />
        </div>
        {run.reason && !running ? (
          <div style={{ marginBlockStart: 12 }}>
            <Callout tone={run.result === 'passed' ? 'success' : 'danger'} title="Reason">
              <p>{run.reason}</p>
            </Callout>
          </div>
        ) : null}
        {!running && base.relatedWorkflowRun ? (
          <div style={{ marginBlockStart: 12 }}>
            <Callout tone="info" title="Same contract violation in a workflow run">
              <p>
                Arazzo run #{base.relatedWorkflowRun.number} of {base.relatedWorkflowRun.workflowTitle} fails on step{' '}
                <span className="demo-mono">{base.relatedWorkflowRun.stepId}</span> for the same reason.{' '}
                <RouterLink to={`/workflows/runs/${base.relatedWorkflowRun.runId}`}>Open workflow run #{base.relatedWorkflowRun.number}</RouterLink>
              </p>
            </Callout>
          </div>
        ) : null}
      </Panel>

      <div className="demo-two-col" data-wide-aside="">
        <Panel title="Operations" as="section">
          <ul className="tr-ops">
            {operations.map((op, i) => (
              <li key={op.id}>
                <h3 className="tr-op-title">
                  <MethodTag method={op.method} />
                  <span className="demo-mono">{op.title.replace(`${op.method} `, '')}</span>
                  <span className="demo-muted">
                    {outcomes[i] === 'untested' ? 'not run yet' : outcomes[i] === 'pass' ? 'passed' : 'failed'}
                  </span>
                </h3>
                {op.steps.length === 0 ? (
                  <p className="demo-muted">Waiting for the first call.</p>
                ) : (
                  <ul className="tr-steps">
                    {op.steps.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          className="tr-step-btn"
                          aria-expanded={selected?.id === s.id}
                          aria-controls="tr-detail"
                          onClick={() => setSelectedId(s.id)}
                        >
                          <StepStatus status={s.result === 'passed' ? 'passed' : 'failed'} />
                          <span className="tr-step-name">{s.name}</span>
                          <span className="tr-step-ms">{s.ms} ms</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Step detail" as="section" id="tr-detail">
          {!selected ? (
            <p className="demo-muted">Select a step to compare the contract with the actual response.</p>
          ) : (
            <div className="stack">
              <p style={{ margin: 0 }}>
                <MethodTag method={selected.method} /> <span className="demo-mono">{selected.path}</span> · HTTP {selected.httpStatus ?? 200} · {selected.ms} ms ·{' '}
                {selected.result === 'passed' ? 'body valid' : `${selected.violations.length} ${selected.violations.length === 1 ? 'violation' : 'violations'}`}
              </p>
              {selected.requestBody ? (
                <p className="demo-muted" style={{ margin: 0 }}>
                  Request body <span className="demo-mono">{selected.requestBody}</span>
                </p>
              ) : null}
              {diff ? (
                <div className="tr-diff">
                  <div>
                    <p className="tr-code-title">Contract {selected.schemaRef ? <span className="demo-mono">{selected.schemaRef}</span> : null}</p>
                    <pre className="tr-code" tabIndex={0} aria-label="Contract schema">
                      <code>
                        {diff.left.map((r) => (
                          <span key={r.n} className="tr-row" data-bad={r.bad ? '' : undefined}>
                            <span className="tr-row-n" aria-hidden="true">{r.n}</span>
                            {r.bad ? <span className="sr-only">Mismatch: </span> : null}
                            {r.text}
                          </span>
                        ))}
                      </code>
                    </pre>
                  </div>
                  <div>
                    <p className="tr-code-title">Actual response</p>
                    <pre className="tr-code" tabIndex={0} aria-label="Actual response">
                      <code>
                        {diff.right.map((r) => (
                          <span key={r.n} className="tr-row" data-bad={r.bad ? '' : undefined}>
                            <span className="tr-row-n" aria-hidden="true">{r.n}</span>
                            {r.bad ? <span className="sr-only">Mismatch: </span> : null}
                            {r.text}
                          </span>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              ) : null}
              {selected.violations.length > 0 ? (
                <div>
                  <h3 className="tr-code-title">Violations ({selected.violations.length})</h3>
                  <ul className="tr-violations">
                    {selected.violations.map((v) => (
                      <li key={v.path} className="tr-violation">
                        <Icon name="warning" size={16} /> <strong className="demo-mono">{v.path}</strong> {v.message}
                        {v.raw ? (
                          <Disclosure summary="Raw message">
                            <pre className="tr-code" tabIndex={0}><code>{v.raw}</code></pre>
                          </Disclosure>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>
                  <Icon name="check" size={16} /> Every property matches the contract.
                </p>
              )}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Runner log" as="section">
        <div className="tr-log" role="log" aria-label="Runner log" tabIndex={0}>
          {log.map((l, i) => (
            <div className="tr-log-line" key={i}>
              <span className="tr-log-time">{l.time}</span>
              <span className="tr-log-level">{l.level}</span>
              <span className="tr-log-msg">{l.message}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Add to CI" as="section">
        <Switch label="Show the CI command for this run" checked={showCi} onChange={setShowCi} />
        {showCi ? (
          <div className="stack" style={{ marginBlockStart: 12 }}>
            <div className="demo-actions-row" style={{ justifyContent: 'space-between' }}>
              <span className="demo-muted">microcks-cli</span>
              <CopyButton value={ci} label="Copy" />
            </div>
            <pre className="tr-ci" tabIndex={0} aria-label="CI command">
              <code>{ci}</code>
            </pre>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
