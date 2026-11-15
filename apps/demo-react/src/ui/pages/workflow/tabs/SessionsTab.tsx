import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import type { Session, SessionCall, WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { MONTHS } from '@/ui/app/format';
import { useClock, useRelativeTime } from '@/ui/app';
import { STATUS_ICON } from '@/ui/app/outcomes';
import { Button, Callout, Checkbox, Facts, Field, Icon, Input, MethodTag, Select, SplitPane, SplitPaneMain, SplitPaneSide, DataTable, type DataTableColumn } from '@microcks/deep-ink';
import { runPath } from '../../workflows/shared';
import '@microcks/demo-styles/pages/workflow/tabs/sessions.css';

/** Examples of the mocked API that can answer a step when a failure is injected (API Pastry 2.0). */
const FAILURE_EXAMPLES: Record<string, { value: string; code: number }[]> = {
  GetPastries: [{ value: 'Size S', code: 200 }, { value: 'Size M', code: 200 }, { value: 'Size L', code: 200 }],
  GetPastryByName: [{ value: 'Millefeuille', code: 200 }, { value: 'Eclair Cafe', code: 200 }, { value: 'Eclair Chocolat', code: 200 }, { value: 'Tartelette Framboise', code: 200 }],
  PatchPastry: [{ value: 'Eclair Cafe · out of stock', code: 409 }, { value: 'Eclair Chocolat · price', code: 200 }],
};

const MICROCKS = 'http://microcks.local:8080';
const SESSION_TTL_S = 3600;
const clockOf = (iso: string) => {
  const d = new Date(iso);
  const two = (n: number) => String(n).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}`;
};

type Tone = 'pass' | 'fail' | 'off' | 'pending';

/** `strong`: 13px 600 with a 13px icon (the session verification fact). */
function Mark({ tone, children, strong }: { tone: Tone; children: ReactNode; strong?: boolean }) {
  return (
    <span className="wf-se-mark" data-tone={tone} data-strong={strong ? '' : undefined}>
      <Icon name={STATUS_ICON[tone]} size={strong ? 13 : 12} strokeWidth={2.4} />
      {children}
    </span>
  );
}

export interface SessionsTabProps {
  detail: WorkflowDetail;
  sessions: Session[];
  runs: WorkflowRun[];
}

export function SessionsTab({ detail, sessions, runs }: SessionsTabProps) {
  const relative = useRelativeTime();
  const clock = useClock();
  const { workflow, document } = detail;
  const failDefault = workflow.steps.find((s) => s.onFailure.length > 0) ?? workflow.steps[0];

  const [selectedId, setSelectedId] = useState<string | undefined>(sessions[0]?.id);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(workflow.inputs.map((i) => [i.name, i.example ?? (i.name === 'size' ? 'M' : '')])),
  );
  const [fail, setFail] = useState(true);
  const [failStep, setFailStep] = useState(failDefault?.stepId ?? '');
  const [failExample, setFailExample] = useState('');
  const [copied, setCopied] = useState<string | undefined>(undefined);

  const step = workflow.steps.find((s) => s.stepId === failStep);
  const exampleList = FAILURE_EXAMPLES[step?.operationId ?? ''] ?? [];
  const example = exampleList.some((e) => e.value === failExample) ? failExample : (exampleList[0]?.value ?? '');
  const errors: Record<string, string> = {};
  for (const input of workflow.inputs) {
    const v = (values[input.name] ?? '').trim();
    if ((input.type === 'number' || input.type === 'integer') && !/^-?\d+(\.\d+)?$/.test(v)) errors[input.name] = `${input.name} must be a number, such as 3.9.`;
  }
  const valid = Object.keys(errors).length === 0;
  const inputs = Object.fromEntries(
    workflow.inputs.flatMap((i) => {
      const v = (values[i.name] ?? '').trim();
      if (v === '') return [];
      return [[i.name, (i.type === 'number' || i.type === 'integer') && /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : v]];
    }),
  );
  const body = { documentId: `${document.title}:${document.version}`, workflowId: workflow.workflowId, inputs, ...(fail && example ? { failures: { [failStep]: example } } : {}) };
  const curl = `curl -X POST '${MICROCKS}/api/arazzo/sessions' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`;
  const copy = (id: string, text: string) => {
    if (!valid) return;
    void navigator.clipboard
      ?.writeText(text)
      .then(() => setCopied(id))
      .catch(() => undefined);
  };

  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0];
  const sessionId = sessions[0]?.id ?? 's-7f3a2c91';
  const runOf = (s: Session) => (s.verification ? runs.find((r) => r.origin.kind === 'session' && r.origin.sessionId === s.id && r.number === s.verification?.runNumber) : undefined);
  const services = [...new Set(workflow.steps.map((s) => s.sourceName))];
  const serviceName = services.length === 1 && services[0] === 'apiPastry' ? 'API Pastry 2.0' : 'its API';

  const callColumns: DataTableColumn<SessionCall>[] = [
    { key: 'n', header: 'Call', mono: true, render: (c) => <span className="wf-se-strong">#{c.n}</span> },
    {
      key: 'req',
      header: 'Request',
      render: (c) => (
        <span className="wf-se-stack">
          <span className="wf-se-req">
            <MethodTag size="xs" method={c.method} />
            {c.path}
          </span>
          <span className="wf-se-status">→ {c.httpStatus}</span>
        </span>
      ),
    },
    {
      key: 'step',
      header: 'Step',
      render: (c) =>
        c.stepId === 'unexpected' ? (
          <span className="wf-se-step" data-tone="fail">
            <Icon name="x-circle" size={12} strokeWidth={2.4} />
            unexpected
          </span>
        ) : (
          <span className="wf-se-step">{c.stepId}</span>
        ),
    },
    { key: 'contract', header: `Contract of ${serviceName}`, render: (c) => <Mark tone={c.contract.state}>{c.contract.text}</Mark> },
    { key: 'data', header: 'Data passing', render: (c) => <Mark tone={c.dataPassing.state}>{c.dataPassing.text}</Mark> },
  ];

  const metaOf = (s: Session) => {
    if (s.state === 'open') {
      const left = Math.max(0, Math.round((new Date(s.openedAt).getTime() + SESSION_TTL_S * 1000 - clock.now().getTime()) / 60_000));
      return `Opened ${relative(s.openedAt)} · closes by itself in ${left} min`;
    }
    const secs = s.closedAt ? Math.round((new Date(s.closedAt).getTime() - new Date(s.openedAt).getTime()) / 1000) : undefined;
    return `Opened ${relative(s.openedAt)} · ${clockOf(s.openedAt)}${secs !== undefined ? ` · closed by the test after ${secs} s` : ''}`;
  };
  const verdictOf = (s: Session): { tone: Tone; text: string } =>
    s.verification
      ? { tone: s.verification.result === 'SUCCESS' ? 'pass' : 'fail', text: `Verification #${s.verification.runNumber} ${s.verification.result === 'SUCCESS' ? 'passed' : 'failed'}` }
      : { tone: 'pending', text: 'Not verified yet' };

  return (
    <div className="wf-se-tab">
      <section aria-labelledby="wf-sess-title" className="wf-se-panel">
        <div className="wf-se-intro">
          <h2 id="wf-sess-title">Verification sessions</h2>
          <p>
            A verification session checks that your application calls the APIs the way <span className="demo-mono">{workflow.workflowId}</span> says, while it runs
            against the ordinary Microcks mocks. Your test opens a session, the application makes its calls carrying the session id, then the test asks Microcks to
            verify the calls it received.
          </p>
        </div>
        <ol className="wf-se-api">
          {[
            { title: 'Open a session', method: 'POST', path: '/api/arazzo/sessions', text: 'Your test sends the workflow, its inputs and the steps to fail. Microcks answers 201 with the session id.' },
            {
              title: 'The application calls the mocks',
              path: `x-microcks-session: ${sessionId}`,
              text: `It calls the ordinary mocks of ${serviceName} with this header, or microcks-session in its W3C baggage. Later steps are answered with the outputs of earlier ones and the values the app sent.`,
            },
            {
              title: 'Verify the calls',
              method: 'POST',
              path: '/api/arazzo/sessions/{id}/verification',
              text: 'Checks each call against the steps: order (relaxed by dependsOn), data passing, inputs, the contract of its API, and unexpected calls. Creates a run with the origin Session.',
            },
            { title: 'Close the session', method: 'DELETE', path: '/api/arazzo/sessions/{id}', text: '204 No Content. The calls stay with the verification run.' },
          ].map((a, i) => (
            <li key={a.title}>
              <span className="wf-se-api-head">
                <span className="wf-se-n" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="wf-se-api-title">
                  <span className="sr-only">{i + 1}. </span>
                  {a.title}
                </span>
              </span>
              <span className="wf-se-api-path">
                {a.method ? <MethodTag size="xs" method={a.method} /> : null}
                <span>{a.path}</span>
              </span>
              <span className="wf-se-api-text">{a.text}</span>
            </li>
          ))}
        </ol>
        <span className="wf-se-note">A session closes by itself after {SESSION_TTL_S} s and records at most 1000 calls.</span>
      </section>

      {workflow.runnability.runnable ? (
        <div className="wf-se-pair">
          <section aria-labelledby="wf-builder-title" className="wf-se-panel" data-size="half">
            <div className="wf-se-intro">
              <h2 id="wf-builder-title">Session builder</h2>
              <span className="wf-se-sub">Build the request your test sends to open a session.</span>
            </div>
            <fieldset className="wf-se-inputs">
              <legend>Inputs</legend>
              {workflow.inputs.map((input) => (
                <div key={input.name} className="wf-se-input">
                  <Field
                    label={
                      <>
                        <span className="demo-mono wf-se-name">{input.name}</span> · {input.name === 'size' ? 'S, M or L' : input.type}
                      </>
                    }
                    error={errors[input.name]}
                  >
                    {(c) =>
                      input.name === 'size' ? (
                        <Select {...c} value={values[input.name] ?? 'M'} onChange={(e) => setValues((v) => ({ ...v, [input.name]: e.target.value }))}>
                          {['S', 'M', 'L'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          {...c}
                          inputMode={input.type === 'number' ? 'decimal' : undefined}
                          value={values[input.name] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [input.name]: e.target.value }))}
                        />
                      )
                    }
                  </Field>
                </div>
              ))}
              {workflow.inputs.length === 0 ? <p className="wf-se-sub">This workflow has no input.</p> : null}
            </fieldset>
            <div className="wf-se-fail">
              <Checkbox label="Make a step fail on the mocks to test your compensation" checked={fail} onChange={(e) => setFail(e.target.checked)} />
              {fail ? (
                <>
                  <div className="wf-se-fail-fields">
                    <div className="wf-se-input">
                      <Field label="Step">
                        {(c) => (
                          <Select {...c} value={failStep} onChange={(e) => setFailStep(e.target.value)}>
                            {workflow.steps.map((s, i) => (
                              <option key={s.stepId} value={s.stepId}>
                                {i + 1} · {s.stepId}
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                    <div className="wf-se-input" data-size="wide">
                      <Field
                        label={
                          <>
                            Answered with the example of <span className="demo-mono wf-se-name">{step?.operationId}</span>
                          </>
                        }
                      >
                        {(c) => (
                          <Select {...c} value={example} onChange={(e) => setFailExample(e.target.value)} disabled={exampleList.length === 0}>
                            {exampleList.map((e) => (
                              <option key={e.value} value={e.value}>
                                {e.value} ({e.code})
                              </option>
                            ))}
                          </Select>
                        )}
                      </Field>
                    </div>
                  </div>
                  <span className="wf-se-note">
                    In the session, the mocks answer <span className="demo-mono">{failStep}</span> with this existing example of {serviceName}, so your application meets
                    the failure and runs its compensation.
                  </span>
                </>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="wf-req-title" className="wf-se-panel" data-size="half" data-gap="tight">
            <div className="wf-se-req-head">
              <h2 id="wf-req-title">
                <MethodTag size="xs" method="POST" />
                <span className="demo-mono wf-se-req-path">/api/arazzo/sessions</span>
              </h2>
              <div className="wf-se-req-actions">
                <Button size="sm" disabled={!valid} onClick={() => copy('body', JSON.stringify(body, null, 2))}>
                  {copied === 'body' ? 'Copied' : 'Copy body'}
                </Button>
                <Button size="sm" disabled={!valid} onClick={() => copy('curl', curl)}>
                  {copied === 'curl' ? 'Copied' : 'Copy curl'}
                </Button>
              </div>
            </div>
            <pre aria-label="Request body" aria-live="polite" className="wf-se-pre">
              {JSON.stringify(body, null, 2)}
            </pre>
            <div className="wf-se-answer">
              <span className="wf-se-answer-line">
                <span className="wf-se-code">201</span>
                <span className="demo-mono wf-se-sub">Location: /api/arazzo/sessions/{sessionId}</span>
              </span>
              <span className="wf-se-note">400 with the reason in plain text when Microcks refuses the session, for an unknown step or example.</span>
            </div>
          </section>
        </div>
      ) : (
        <Callout tone="warning" title="Sessions are not available">
          {workflow.runnability.message}.
        </Callout>
      )}

      <section aria-labelledby="wf-recent-title" className="wf-se-panel">
        <SplitPane gap="16px" sideWidth="300px" sideMax="380px" mainWidth="520px" keepSideMax>
          <SplitPaneSide className="wf-se-list">
            <h2 id="wf-recent-title">Recent sessions</h2>
            {sessions.length === 0 ? (
              <p className="wf-se-sub">No session yet for this workflow.</p>
            ) : (
              <ul>
                {sessions.map((s) => {
                  const v = verdictOf(s);
                  return (
                    <li key={s.id}>
                      <button type="button" className="wf-se-item" aria-pressed={s.id === selected?.id} onClick={() => setSelectedId(s.id)}>
                        <span className="wf-se-item-head">
                          <span className="demo-mono wf-se-strong">{s.id}</span>
                          <span className="wf-se-state" data-state={s.state}>
                            <span aria-hidden="true" className="wf-se-dot" />
                            {s.state}
                          </span>
                        </span>
                        <span className="wf-se-sub">{s.app}</span>
                        <span className="wf-se-item-foot">
                          <span className="wf-se-muted">
                            {s.calls.length} {s.calls.length === 1 ? 'call' : 'calls'} received
                          </span>
                          <Mark tone={v.tone}>{v.text}</Mark>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SplitPaneSide>

          {selected ? (
            <SplitPaneMain className="wf-se-detail">
              <div className="wf-se-detail-head">
                <h3>
                  Session <span className="demo-mono">{selected.id}</span>
                </h3>
                <span className="wf-se-muted">{metaOf(selected)}</span>
              </div>
              <Facts
                layout="columns"
                items={[
                  { term: 'Inputs', mono: true, value: Object.entries(selected.inputs).map(([k, v]) => `${k}=${String(v)}`).join(' · ') || 'none' },
                  { term: 'Steps set to fail', mono: true, value: selected.failureInjection ? `${selected.failureInjection.stepId} → ${selected.failureInjection.example}` : 'none' },
                  {
                    term: 'Verification',
                    value: (
                      <span className="wf-se-fact-line">
                        {selected.verification ? (
                          <Mark tone={selected.verification.result === 'SUCCESS' ? 'pass' : 'fail'} strong>
                            {selected.verification.result === 'SUCCESS' ? 'Passed' : 'Failed'} · #{selected.verification.runNumber}
                          </Mark>
                        ) : (
                          <Mark tone="pending" strong>
                            Not verified yet
                          </Mark>
                        )}
                      </span>
                    ),
                  },
                ]}
              />
              {selected.verification?.result === 'FAILURE' ? (
                <div className="wf-se-alert">
                  <span className="wf-se-alert-title">
                    <Icon name="x-circle" size={15} strokeWidth={2.2} />
                    The calls of the session do not follow the workflow
                  </span>
                  <ul>
                    {selected.verification.problems.map((p) => (
                      <li key={p.lead + p.text}>
                        {p.lead} <span className="wf-se-problem">{p.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="wf-se-calls">
                <span aria-hidden="true" className="wf-se-caption">
                  Received calls, in the order of receipt, each mapped to its step
                </span>
                <DataTable<SessionCall>
                  captionHidden
                  headerCase="sentence"
                  density="compact"
                  caption="Received calls, in the order of receipt, each mapped to its step"
                  columns={callColumns}
                  rows={selected.calls}
                  rowKey="n"
                  emptyText="No call received yet."
                />
              </div>
              <div className="wf-se-foot">
                {(() => {
                  const run = runOf(selected);
                  return run ? (
                    <Button asChild size="sm">
                      <Link to={runPath(run.id)}>Open verification #{run.number}</Link>
                    </Button>
                  ) : null;
                })()}
                {selected.state === 'open' ? <span className="demo-mono wf-se-sub">POST /api/arazzo/sessions/{selected.id}/verification</span> : null}
                <span className="wf-se-muted">
                  {selected.verification
                    ? `Verified ${relative(runOf(selected)?.startedAt ?? selected.closedAt ?? selected.openedAt)} against the Microcks mocks.`
                    : `Not verified yet · ${selected.calls.length} of 1000 calls recorded.`}
                </span>
              </div>
            </SplitPaneMain>
          ) : null}
        </SplitPane>
      </section>
    </div>
  );
}
