import { useState } from 'react';
import type { Session, SessionCall, WorkflowRun } from '@/domain/arazzo';
import type { WorkflowDetail } from '@/application/arazzo';
import { useAnnounce, useRelativeTime, useUseCases } from '@/ui/app';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox } from '@/ui/components/ui/checkbox';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { MethodTag } from '@/ui/components/ui/method-tag';
import { Select } from '@/ui/components/ui/select';
import { DataTable, type DataTableColumn } from '@/ui/components/ui/table';
import { ErrorBlock, PageLink, runPath } from '../../workflows/shared';

/** Examples of the mocked API that can answer a step when a failure is injected (API Pastry 2.0). */
const FAILURE_EXAMPLES: Record<string, { value: string; code: number }[]> = {
  GetPastries: [{ value: 'Size S', code: 200 }, { value: 'Size M', code: 200 }, { value: 'Size L', code: 200 }],
  GetPastryByName: [{ value: 'Millefeuille', code: 200 }, { value: 'Eclair Cafe', code: 200 }, { value: 'Eclair Chocolat', code: 200 }, { value: 'Tartelette Framboise', code: 200 }],
  PatchPastry: [{ value: 'Eclair Cafe · out of stock', code: 409 }, { value: 'Eclair Chocolat · price', code: 200 }],
};

const MOCK_BASE = 'http://microcks.local:8080/rest/API+Pastry/2.0';

function Check({ state, text }: { state: 'pass' | 'fail' | 'off'; text: string }) {
  return (
    <span className="wf-row wf-callnote">
      <Icon name={state === 'pass' ? 'check' : state === 'fail' ? 'cross' : 'dash'} size={14} />
      <strong>{state === 'pass' ? 'Passed' : state === 'fail' ? 'Failed' : 'Off'}</strong>
      <span className="wf-small wf-muted">{text}</span>
    </span>
  );
}

export interface SessionsTabProps {
  detail: WorkflowDetail;
  sessions: Session[];
  runs: WorkflowRun[];
  onChanged: () => void;
}

export function SessionsTab({ detail, sessions, runs, onChanged }: SessionsTabProps) {
  const uc = useUseCases();
  const announce = useAnnounce();
  const relative = useRelativeTime();
  const { workflow, document } = detail;

  const [selectedId, setSelectedId] = useState<string | undefined>(sessions[0]?.id);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(workflow.inputs.map((i) => [i.name, i.example ?? (i.name === 'size' ? 'M' : '')])),
  );
  const [app, setApp] = useState('checkout-web · saga tests');
  const [fail, setFail] = useState(false);
  const [failStep, setFailStep] = useState(workflow.steps[2]?.stepId ?? workflow.steps[0]?.stepId ?? '');
  const [failExample, setFailExample] = useState('');
  const [busy, setBusy] = useState<'open' | 'verify' | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [touched, setTouched] = useState(false);

  const step = workflow.steps.find((s) => s.stepId === failStep);
  const exampleList = FAILURE_EXAMPLES[step?.operationId ?? ''] ?? [];
  const example = exampleList.some((e) => e.value === failExample) ? failExample : (exampleList[0]?.value ?? '');
  const errors: Record<string, string> = {};
  for (const input of workflow.inputs) {
    const v = (values[input.name] ?? '').trim();
    if (v !== '' && (input.type === 'number' || input.type === 'integer') && !/^-?\d+(\.\d+)?$/.test(v)) errors[input.name] = `${input.name} must be a number, such as 3.9.`;
  }
  const valid = Object.keys(errors).length === 0;

  const inputs = Object.fromEntries(
    workflow.inputs.flatMap((i) => {
      const v = (values[i.name] ?? '').trim();
      if (v === '') return [];
      return [[i.name, i.type === 'number' || i.type === 'integer' ? Number(v) : v]];
    }),
  );
  const body = { documentId: `${document.title}:${document.version}`, workflowId: workflow.workflowId, inputs, ...(fail && example ? { failures: { [failStep]: example } } : {}) };
  const bodyText = JSON.stringify(body, null, 2);
  const curl = `curl -X POST '${new URL('/api/arazzo/sessions', 'http://microcks.local:8080').href}' \\\n  -H 'Content-Type: application/json' \\\n  -d '${JSON.stringify(body)}'`;

  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0];
  const verificationRun = selected?.verification ? runs.find((r) => r.origin.kind === 'session' && r.origin.sessionId === selected.id) : undefined;

  const open = async () => {
    setTouched(true);
    if (!valid) return;
    setBusy('open');
    setError(null);
    try {
      const created = await uc.arazzo.openSession({
        documentId: document.id,
        workflowId: workflow.workflowId,
        app,
        inputs,
        failureInjection: fail && example ? { stepId: failStep, example } : undefined,
      });
      setSelectedId(created.id);
      announce(`Session ${created.id} opened.`);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(null);
    }
  };

  const verify = async (id: string) => {
    setBusy('verify');
    setError(null);
    try {
      const done = await uc.arazzo.verifySession(id);
      announce(`Session ${id} verified: ${done.verification?.result === 'SUCCESS' ? 'passed' : 'failed'}.`);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setBusy(null);
    }
  };

  const callColumns: DataTableColumn<SessionCall>[] = [
    { key: 'n', header: 'Call', align: 'end' },
    {
      key: 'req',
      header: 'Request',
      render: (c) => (
        <span className="wf-cell-stack wf-cell-wide">
          <span className="wf-row">
            <MethodTag method={c.method} />
            <code>{c.path}</code>
          </span>
          <span className="wf-small wf-muted">→ {c.httpStatus}</span>
        </span>
      ),
    },
    {
      key: 'step',
      header: 'Step',
      render: (c) =>
        c.stepId === 'unexpected' ? (
          <span className="wf-row">
            <Icon name="warning" size={14} />
            <strong>unexpected call</strong>
          </span>
        ) : (
          c.stepId
        ),
    },
    { key: 'contract', header: 'Contract of API Pastry 2.0', render: (c) => <Check state={c.contract.state} text={c.contract.text} /> },
    { key: 'data', header: 'Data passing', render: (c) => <Check state={c.dataPassing.state} text={c.dataPassing.text} /> },
  ];

  const sessionId = selected?.id ?? 's-7f3a2c91';

  return (
    <div className="wf-section">
      <section aria-labelledby="wf-sess-title" className="wf-section">
        <h2 id="wf-sess-title" className="wf-h2">
          Verification sessions
        </h2>
        <p className="wf-lead">
          A verification session checks that your application calls the APIs the way <code>{workflow.workflowId}</code> says, while it runs against the ordinary Microcks
          mocks. Your test opens a session, the application makes its calls carrying the session id, then the test asks Microcks to verify the calls it
          received.
        </p>
        <ol className="wf-api-steps">
          <li>
            <strong>1. Open a session</strong>
            <span className="wf-row">
              <MethodTag method="POST" />
              <code>/api/arazzo/sessions</code>
            </span>
            <span className="wf-small">Your test sends the workflow, its inputs and the steps to fail. Microcks answers 201 with the session id.</span>
          </li>
          <li>
            <strong>2. The application calls the mocks</strong>
            <code className="wf-mono">x-microcks-session: {sessionId}</code>
            <span className="wf-small">
              It calls the ordinary mocks of API Pastry 2.0 with this header, or <code>microcks-session</code> in its W3C baggage. Later steps are answered with
              the outputs of earlier ones and the values the app sent.
            </span>
          </li>
          <li>
            <strong>3. Verify the calls</strong>
            <span className="wf-row">
              <MethodTag method="POST" />
              <code>/api/arazzo/sessions/{'{id}'}/verification</code>
            </span>
            <span className="wf-small">Checks each call against the steps: order (relaxed by dependsOn), data passing, inputs, the contract of its API, and unexpected calls. Creates a run with the origin Session.</span>
          </li>
          <li>
            <strong>4. Close the session</strong>
            <span className="wf-row">
              <MethodTag method="DELETE" />
              <code>/api/arazzo/sessions/{'{id}'}</code>
            </span>
            <span className="wf-small">204 No Content. The calls stay with the verification run.</span>
          </li>
        </ol>
        <CodeBlock
          caption="The application tags every call with the session"
          language="bash"
          code={`curl -H 'x-microcks-session: ${sessionId}' '${MOCK_BASE}/pastries?size=M'`}
        />
        <p className="wf-small wf-muted" style={{ margin: 0 }}>
          A session closes by itself after 3600 s and records at most 1000 calls.
        </p>
      </section>

      {workflow.runnability.runnable ? (
        <div className="wf-grid-2">
          <section aria-labelledby="wf-builder-title" className="wf-section">
            <h2 id="wf-builder-title" className="wf-h2">
              Session builder
            </h2>
            <p className="wf-small wf-muted" style={{ margin: 0 }}>
              Build the request your test sends to open a session.
            </p>
            <Field label="Application under test" required>
              {(c) => <Input {...c} value={app} onChange={(e) => setApp(e.target.value)} />}
            </Field>
            <fieldset className="di-fieldset">
              <legend>Inputs</legend>
              <div className="wf-fields">
                {workflow.inputs.map((input) => (
                  <Field
                    key={input.name}
                    label={
                      <>
                        {input.name} <span className="wf-small wf-muted">· {input.name === 'size' ? 'S, M or L' : input.type}</span>
                      </>
                    }
                    error={touched || (values[input.name] ?? '') !== '' ? errors[input.name] : undefined}
                  >
                    {(c) =>
                      input.name === 'size' ? (
                        <Select {...c} value={values[input.name] ?? 'M'} onChange={(e) => setValues((v) => ({ ...v, [input.name]: e.target.value }))}>
                          {['S', 'M', 'L'].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input {...c} inputMode={input.type === 'number' ? 'decimal' : undefined} value={values[input.name] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [input.name]: e.target.value }))} />
                      )
                    }
                  </Field>
                ))}
                {workflow.inputs.length === 0 ? <p className="wf-muted">This workflow has no input.</p> : null}
              </div>
            </fieldset>
            <Checkbox label="Make a step fail on the mocks to test your compensation" checked={fail} onChange={(e) => setFail(e.target.checked)} />
            {fail ? (
              <div className="wf-fields">
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
                <Field
                  label={
                    <>
                      Answered with the example of <code>{step?.operationId}</code>
                    </>
                  }
                  help={`In the session, the mocks answer ${failStep} with this existing example of API Pastry 2.0, so your application meets the failure and runs its compensation.`}
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
            ) : null}
            <div>
              <Button variant="primary" icon="play" loading={busy === 'open'} onClick={open}>
                Open session
              </Button>
            </div>
          </section>

          <section aria-labelledby="wf-req-title" className="wf-section">
            <div className="wf-row-between">
              <h2 id="wf-req-title" className="wf-h2">
                <MethodTag method="POST" /> <code>/api/arazzo/sessions</code>
              </h2>
            </div>
            <CodeBlock caption="Request body" language="json" code={bodyText} />
            <div className="wf-row">
              <CopyButton value={curl} label="Copy curl" disabled={!valid} />
            </div>
            <p className="wf-small wf-muted" style={{ margin: 0 }}>
              <strong>201</strong> with <code>Location: /api/arazzo/sessions/{sessionId}</code>. <strong>400</strong> with the reason in plain text when Microcks
              refuses the session, for an unknown step or example.
            </p>
          </section>
        </div>
      ) : (
        <Callout tone="warning" title="Sessions are not available">
          {workflow.runnability.message}.
        </Callout>
      )}

      {error ? <ErrorBlock error={error} /> : null}

      <section aria-labelledby="wf-recent-title" className="wf-section">
        <h2 id="wf-recent-title" className="wf-h2">
          Recent sessions
        </h2>
        {sessions.length === 0 ? (
          <p className="wf-muted">No session yet for this workflow.</p>
        ) : (
          <div className="wf-split">
            <ul className="wf-list" aria-label="Sessions">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Button aria-pressed={s.id === selected?.id} onClick={() => setSelectedId(s.id)} style={{ width: '100%', justifyContent: 'space-between' }}>
                    <code>{s.id}</code>
                    <span className="wf-row">
                      <Icon name={s.state === 'open' ? 'running' : 'check'} size={14} />
                      {s.state === 'open' ? 'Open' : 'Closed'}
                    </span>
                    <span className="wf-small">
                      {s.calls.length} {s.calls.length === 1 ? 'call' : 'calls'} · {s.verification ? (s.verification.result === 'SUCCESS' ? 'Passed' : 'Failed') : 'Not verified'}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
            {selected ? (
              <div className="wf-section">
                <h3 className="wf-h3">
                  Session <code>{selected.id}</code>
                </h3>
                <p className="wf-small wf-muted" style={{ margin: 0 }}>
                  {selected.app} · opened {relative(selected.openedAt)} · {selected.state}
                </p>
                <dl className="wf-kv">
                  <dt>Inputs</dt>
                  <dd>{Object.entries(selected.inputs).map(([k, v]) => `${k}=${String(v)}`).join(' ') || 'none'}</dd>
                  <dt>Steps set to fail</dt>
                  <dd>{selected.failureInjection ? `${selected.failureInjection.stepId} answered with ${selected.failureInjection.example}` : 'none'}</dd>
                  <dt>Verification</dt>
                  <dd>{selected.verification ? (selected.verification.result === 'SUCCESS' ? `Passed · run #${selected.verification.runNumber}` : `Failed · run #${selected.verification.runNumber}`) : 'Not verified yet'}</dd>
                </dl>
                {selected.verification && selected.verification.result === 'FAILURE' ? (
                  <Callout tone="danger" title="The calls of the session do not follow the workflow" live="polite">
                    <ul className="wf-plain-list">
                      {selected.verification.problems.map((p) => (
                        <li key={p.lead + p.text}>
                          <strong>{p.lead}</strong> {p.text}
                        </li>
                      ))}
                    </ul>
                  </Callout>
                ) : null}
                <DataTable<SessionCall>
                  caption="Received calls, in the order of receipt, each mapped to its step"
                  columns={callColumns}
                  rows={selected.calls}
                  rowKey="n"
                  emptyText="No call received yet."
                />
                <div className="wf-row">
                  {selected.verification && verificationRun ? <PageLink to={runPath(verificationRun.id)}>Open verification run #{verificationRun.number}</PageLink> : null}
                  {selected.state === 'open' ? (
                    <>
                      <Button loading={busy === 'verify'} onClick={() => verify(selected.id)}>
                        Verify the calls
                      </Button>
                      <code className="wf-mono">POST /api/arazzo/sessions/{selected.id}/verification</code>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
