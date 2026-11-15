import { useId, useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { formatDuration } from '@/domain/shared';
import { stepOffsets, type Step, type StepResult, type Workflow, type WorkflowRun } from '@/domain/arazzo';
import { Chip, CodeBlock, Icon, StatusBadge, MethodTag } from '@microcks/deep-ink';
import { Verdict } from './run-parts';
import {
  STEP_WORD,
  attemptRows,
  copilotExamplePath,
  flowIcon,
  msText,
  noStepOutputsText,
  responseCaption,
  retryOf,
  runningStepLabel,
  schemaRefText,
  stepMsLabel,
  stepTags,
  stopText,
  threadSources,
  timelineRows,
  valueText,
  waitingText,
  type StepLook,
} from './steps';

export { phaseOf, type Phase } from './steps';

export function RunSteps({ run, workflow }: { run: WorkflowRun; workflow?: Workflow }) {
  const offsets = stepOffsets(run);
  const sources = threadSources(workflow);
  const stop = stopText(run);
  const total = run.steps.length;

  return (
    <section aria-labelledby="wfr-steps-h" className="wfr-steps-section">
      <div className="wfr-steps-head">
        <h2 id="wfr-steps-h" className="wfr-h2">
          Steps
        </h2>
        <span className="wfr-muted">
          {total} steps on the{' '}
          {sources.length === 1 ? (
            <>
              <span className="wfr-mono">{sources[0]}</span> thread
            </>
          ) : (
            `${sources.length} threads`
          )}{' '}
          · chips between steps show the values handed over
        </span>
      </div>
      <ol aria-label="Workflow steps" className="wfr-timeline">
        {timelineRows(run, workflow).map(({ step, def, look, prev, skipped, ready, handovers, lineOn, last }, i) => {
          return [
            handovers.length > 0 || skipped ? (
              <li key={`${step.stepId}-baton`} className="wfr-tl-item" data-kind="baton">
                <span className="wfr-rail" aria-hidden="true">
                  <span className="wfr-rail-line" data-on={ready ? '' : undefined} />
                </span>
                <div className="wfr-tl-body">
                  {skipped ? (
                    <span className="wfr-baton-skip">
                      <Icon name="dash" size={12} strokeWidth={2.4} />
                      Not handed over: {stop}
                    </span>
                  ) : ready ? (
                    <div className="wfr-baton">
                      <div className="wfr-baton-chips">
                        {handovers.map((h) => (
                          <span key={h.target} className="wfr-baton-chip" title={h.expression}>
                            <span className="wfr-mono">
                              {h.name} <span className="wfr-faint">=</span> <strong>{valueText(h.value)}</strong>
                            </span>
                            <Icon name="arrow-right" size={14} className="wfr-faint" />
                            <span className="wfr-secondary">{h.target}</span>
                          </span>
                        ))}
                      </div>
                      <span className="wfr-baton-from">from {handovers.map((h) => h.expression).join(' · ')}</span>
                    </div>
                  ) : (
                    <span className="wfr-baton-wait">
                      <span className="wfr-pulse-bar" aria-hidden="true" />
                      waiting for {prev?.stepId} outputs
                    </span>
                  )}
                </div>
              </li>
            ) : null,
            <li key={step.stepId} className="wfr-tl-item" data-kind="step">
              <span className="wfr-rail" aria-hidden="true">
                <span className="wfr-rail-top" data-on={ready || i === 0 ? '' : undefined} data-hidden={i === 0 && handovers.length === 0 ? '' : undefined} />
                <span className="wfr-node" data-look={look}>
                  {i + 1}
                </span>
                <span className="wfr-rail-line" data-on={lineOn ? '' : undefined} data-hidden={last ? '' : undefined} />
              </span>
              <div className="wfr-tl-body" data-kind="step">
                <StepCard index={i} step={step} def={def} look={look} run={run} offset={offsets[i] ?? 0} stop={stop} />
              </div>
            </li>,
          ];
        })}
      </ol>
    </section>
  );
}

function StepCard({ index, step, def, look, run, offset, stop }: { index: number; step: StepResult; def?: Step; look: StepLook; run: WorkflowRun; offset: number; stop: string }) {
  const bodyId = useId();
  const finished = look === 'pass' || look === 'fail';
  // Collapsed by the user, else open: a step that finishes while the run plays opens, as in the prototype.
  const [collapsed, setCollapsed] = useState(false);
  const open = !collapsed;
  const showBody = (finished && open) || look === 'run';
  const tags = stepTags(step, def, look);
  const msLabel = stepMsLabel(step, look);
  const head = (
    <>
      <span className="wfr-step-id-group">
        <span className="wfr-step-id">{step.stepId}</span>
        {def ? (
          <span className="wfr-step-op">
            <MethodTag method={def.method} size="sm" />
            {def.path}
          </span>
        ) : null}
        {def ? <span className="wfr-step-opid">{def.operationId}</span> : null}
        {tags.map((t) => (
          <Chip key={t.text} size="sm" variant="outline" tone={t.tone}>
            {t.text}
          </Chip>
        ))}
      </span>
      {finished || look === 'run' ? <span className="wfr-step-at">at +{formatDuration(offset)}</span> : null}
      <span className="wfr-step-ms">{msLabel}</span>
      {look === 'run' ? (
        <StatusBadge
          shape="bare"
          status="running"
          className="wfr-step-run"
          label={runningStepLabel(run, def)}
        />
      ) : (
        <span className="wfr-step-status" data-look={look}>
          <Icon
            name={look === 'pass' ? 'check' : look === 'fail' ? 'cross' : 'circle'}
            size={14}
            strokeWidth={look === 'pass' || look === 'fail' ? 2.6 : 2}
            strokeDasharray={look === 'notrun' ? '3 3' : undefined}
          />
          {STEP_WORD[look]}
        </span>
      )}
    </>
  );

  return (
    <article className="wfr-step" data-look={look} aria-label={`Step ${index + 1} ${step.stepId}: ${STEP_WORD[look]}`}>
      <h3 className="wfr-step-h">
        {finished ? (
          <button type="button" className="wfr-step-head" aria-expanded={open} aria-controls={bodyId} onClick={() => setCollapsed((c) => !c)}>
            {head}
            <Icon name="chevron" size={16} className="wfr-step-chevron" />
          </button>
        ) : (
          <span className="wfr-step-head">
            {head}
            <span className="wfr-step-chevron-slot" />
          </span>
        )}
      </h3>
      {look === 'notrun' || look === 'pend' ? (
        <p className="wfr-step-pend">{look === 'notrun' ? `Not run: ${stop}.` : 'Queued.'}</p>
      ) : null}
      {showBody ? (
        <div className="wfr-step-body" id={bodyId}>
          <StepBody step={step} def={def} run={run} running={look === 'run'} />
        </div>
      ) : null}
    </article>
  );
}

function StepBody({ step, def, run, running }: { step: StepResult; def?: Step; run: WorkflowRun; running: boolean }) {
  const onMocks = run.target.kind === 'mocks';
  const retry = retryOf(def);
  const lastAttempt = step.attempts[step.attempts.length - 1];
  const criteriaOk = step.criteria.every((c) => c.held);
  const schema = step.schema;
  const coherence = run.coherence.find((c) => c.stepId === step.stepId);
  const listName = coherence ? String(run.steps[0]?.outputs['firstName'] ?? '') : '';
  const lines = step.response?.lines ?? [];
  return (
    <>
      {!running && schema.state === 'fail' ? (
        <p className="wfr-step-failure">
          <Icon name="x-circle" size={14} className="wfr-failure-icon" />
          <span className="wfr-mono">Step failed: {schema.message}</span>
        </p>
      ) : null}
      {def ? <p className="wfr-step-desc">{def.description}</p> : null}

      {step.request ? (
        <div className="wfr-block">
          <h4 className="wfr-h4">Request</h4>
          <div className="wfr-request-line">
            <span className="wfr-request-method">{step.request.method}</span>
            <span className="wfr-request-url">{step.request.url}</span>
          </div>
          {Object.keys(step.request.params).length > 0 ? (
            <div className="wfr-grid-wrap">
              <table className="wfr-grid" data-cols="params">
                <caption className="sr-only">Parameters of {step.stepId}</caption>
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
                        <th scope="row" className="wfr-mono">
                          <strong>{name}</strong> {p ? <span className="wfr-faint">{p.in}</span> : null}
                        </th>
                        <td className="wfr-mono wfr-strong">{value}</td>
                        <td className="wfr-mono wfr-secondary">{p?.value ?? ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
          {step.request.body && def?.requestBody ? (
            <dl className="wfr-body-box">
              <div>
                <dt>requestBody · application/json</dt>
                <dd className="wfr-secondary">{def.requestBody}</dd>
              </div>
              <div>
                <dt>sent</dt>
                <dd className="wfr-strong">{step.request.body}</dd>
              </div>
            </dl>
          ) : null}
          {onMocks && step.baggage ? (
            <p className="wfr-baggage-line">
              <span className="wfr-faint">Baggage</span>
              <code className="wfr-baggage" title="Marks this call in the Live Traces of the API">
                {step.baggage}
              </code>
              <RouterLink to={`/traces?run=${run.id}`} className="wfr-link">
                See in Live traces
              </RouterLink>
            </p>
          ) : null}
        </div>
      ) : null}

      {step.attempts.length > 1 && retry ? (
        <div className="wfr-block">
          <h4 className="wfr-h4">
            Attempts · onFailure retry, retryAfter {retry.retryAfter} s, retryLimit {retry.retryLimit}
          </h4>
          <ol className="wfr-attempts">
            {attemptRows(step, retry).map((a) => {
              return (
                <li key={a.n}>
                  <span className="wfr-attempt-no">Attempt {a.n}</span>
                  <span className="wfr-code-chip">{a.httpStatus}</span>
                  <span className="wfr-attempt-ms">{msText(a.ms)}</span>
                  <span className="wfr-attempt-note">
                    <Icon name={a.failed ? 'cross' : 'check'} size={12} strokeWidth={2.4} className="wfr-attempt-icon" />
                    <span>
                      {a.outcome} → {a.next}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      <div className="wfr-block">
        <div className="wfr-response-head">
          <h4 className="wfr-h4">Response</h4>
          {!running && lastAttempt ? (
            <>
              <span className="wfr-code-chip" data-tone={lastAttempt.httpStatus < 300 ? 'success' : 'danger'}>
                {lastAttempt.httpStatus}
              </span>
              <span className="wfr-mono wfr-secondary">
                {step.response?.meta} · {msText(lastAttempt.ms)}
                {step.attempts.length > 1 ? ` · attempt ${step.attempts.length}` : ''}
              </span>
            </>
          ) : null}
        </div>
        {running ? (
          <div role="status" aria-label="Waiting for response" className="wfr-waiting">
            <span className="wfr-pulse-bar" style={{ width: '46%' }} />
            <span className="wfr-pulse-bar" style={{ width: '72%' }} />
            <span className="wfr-pulse-bar" style={{ width: '58%' }} />
            <span className="wfr-faint">
              {waitingText(run, step)}
            </span>
          </div>
        ) : lines.length > 0 ? (
          <CodeBlock
            className="wfr-response"
            tone={schema.state === 'fail' ? 'danger' : undefined}
            gutter="narrow"
            language="json"
            lines={lines}
            lineNumbers
            copy={false}
            variant="plain"
            caption={responseCaption(step)}
          />
        ) : (
          <span className="wfr-faint wfr-small">Body · Empty</span>
        )}
      </div>

      {!running ? (
        <div className="wfr-checks">
          <div className="wfr-block">
            <div className="wfr-check-head">
              <h4 className="wfr-h4" data-size="13">
                Success criteria
              </h4>
              {criteriaOk ? (
                <Verdict tone="success" icon="check">
                  Held {step.criteria.length}/{step.criteria.length}
                </Verdict>
              ) : (
                <Verdict tone="danger" icon="cross">
                  Did not hold
                </Verdict>
              )}
            </div>
            {step.criteria.length > 0 ? (
              <div className="wfr-grid-wrap">
                <table className="wfr-grid" data-cols="criteria">
                  <caption className="sr-only">Success criteria of {step.stepId}</caption>
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
                        <th scope="row" className="wfr-mono">
                          {c.condition} {c.kind === 'regex' ? <span className="wfr-kind">regex</span> : null}
                        </th>
                        <td className="wfr-mono wfr-secondary">{c.evaluation}</td>
                        <td>
                          <Verdict tone={c.held ? 'success' : 'danger'} icon={c.held ? 'check' : 'cross'}>
                            {c.held ? 'Passed' : 'Failed'}
                          </Verdict>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
          <div className="wfr-block" data-gap="6">
            <div className="wfr-check-head">
              <h4 className="wfr-h4" data-size="13">
                Schema validation
              </h4>
              {schema.state === 'pass' ? (
                <Verdict tone="success" icon="check">
                  Passed
                </Verdict>
              ) : schema.state === 'fail' ? (
                <Verdict tone="danger" icon="cross">
                  Failed
                </Verdict>
              ) : (
                <Verdict tone="muted" icon="dash">
                  {schema.state === 'na' ? 'Not applicable' : 'Off'}
                </Verdict>
              )}
            </div>
            <span className="wfr-schema-ref">{schemaRefText(step)}</span>
            <span className="wfr-schema-text" data-tone={schema.state === 'fail' ? 'text' : undefined}>
              {schema.message}
            </span>
          </div>
        </div>
      ) : null}

      {!running && coherence ? (
        <div role="note" className="wfr-coherence">
          <Icon name="info" size={16} className="wfr-coherence-icon" />
          <div className="wfr-coherence-body">
            <p>
              <strong>The mocks do not form a coherent scenario.</strong> GetPastries returns “{listName}”, but <span className="wfr-mono">{coherence.operationId}</span> has no
              example for <span className="wfr-code-inline">name</span> = {listName}. Add that example to the OpenAPI document, or let the workflow send a value that has one.
            </p>
            <div className="wfr-coherence-links">
              <RouterLink to="/services/pastry2" className="wfr-link" title="GET /pastries/{name} on API Pastry 2.0">
                Open {coherence.operationId}
              </RouterLink>
              <RouterLink to={copilotExamplePath(coherence.copilotHint)} className="wfr-link">
                Generate the example with the AI Copilot
              </RouterLink>
            </div>
          </div>
        </div>
      ) : null}

      {!running ? (
        <div className="wfr-block" data-gap="10">
          <div className="wfr-outputs">
            <span className="wfr-outputs-label">Outputs</span>
            {Object.keys(step.outputs).length > 0 ? (
              Object.entries(step.outputs).map(([k, v]) => {
                const expr = def?.outputs.find((o) => o.name === k)?.expression ?? '';
                return (
                  <span key={k} className="wfr-output-chip" title={expr}>
                    {k} <span className="wfr-faint">=</span> <strong>{valueText(v)}</strong>
                    <span className="wfr-faint">from {expr}</span>
                  </span>
                );
              })
            ) : (
              <span className="wfr-faint wfr-small">{noStepOutputsText(step)}</span>
            )}
          </div>
          <div className="wfr-flow" data-kind={step.flow.kind}>
            <Icon name={flowIcon(step.flow.kind)} size={16} className="wfr-flow-icon" />
            <span className="wfr-flow-text">
              <span className="wfr-flow-title">{step.flow.title}</span>
              <span className="wfr-flow-detail">{step.flow.text}</span>
            </span>
          </div>
        </div>
      ) : null}
    </>
  );
}
