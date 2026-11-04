import '../explore-kit/explore.css';
import './agent.css';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import {
  agentRunPassed,
  cellKey,
  setupSummary,
  totalsOf,
  transportScore,
  validateSetup,
  type AgentCheck,
  type AgentCheckDetail,
  type AgentTestDefaults,
  type AgentTestRunWithDetails,
  type AgentTestSetup,
  type DetailTone,
  type TransportId,
} from '@/domain/agents';
import { PageHeader, useAnnounce, useQuery, usePageTitle, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox, RadioGroup } from '@/ui/components/ui/checkbox';
import { CodeBlock } from '@/ui/components/ui/code-block';
import { ConformanceMatrix, type CheckResult, type MatrixGroup, type MatrixRow } from '@/ui/components/ui/conformance-matrix';
import { Disclosure } from '@/ui/components/ui/disclosure';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { Select } from '@/ui/components/ui/select';
import { StatusBadge } from '@/ui/components/ui/status-badge';
import { TaskLanes } from '@/ui/components/ui/task-timeline';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';

const CARD_ROWS: { id: string; label: string; sub: string; perTransport: boolean }[] = [
  { id: 'schema', label: 'Schema · required fields', sub: 'A2A v1.0 JSON Schema · name, version, supportedInterfaces, capabilities, skills…', perTransport: false },
  { id: 'iface', label: 'Interfaces reachable', sub: 'each supportedInterfaces entry answers with A2A-Version: 1.0', perTransport: true },
  { id: 'caps', label: 'Capabilities honoured', sub: 'streaming and pushNotifications declared true are exercised', perTransport: true },
  { id: 'sig', label: 'Signature (JWS)', sub: 'optional in v1.0 · absent is a warning, not an error', perTransport: false },
];
const TRANSPORT_LABEL: Record<TransportId, { label: string; sub: string }> = {
  jsonrpc: { label: 'JSON-RPC', sub: 'preferred · SSE' },
  http: { label: 'HTTP+JSON', sub: 'SSE' },
  grpc: { label: 'gRPC', sub: 'stream' },
};
const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`);
const TONE_WORD: Record<DetailTone, string> = { ok: 'ok', bad: 'problem', warn: 'warning', muted: '', plain: '' };

function Setup({ defaults, onRun }: { defaults: AgentTestDefaults; onRun: (setup: AgentTestSetup) => void }) {
  const [setup, setSetup] = useState<AgentTestSetup>(defaults.setup);
  const [timeout, setTimeoutText] = useState(String(defaults.setup.timeoutMs));
  const merged: AgentTestSetup = { ...setup, timeoutMs: Number.parseInt(timeout, 10) };
  const problem = validateSetup(merged);
  const urlOk = /^https?:\/\/\S+$/.test(setup.cardUrl.trim());
  const timeoutOk = timeout.trim() !== '' && Number.isFinite(merged.timeoutMs) && merged.timeoutMs > 0;
  const secret = defaults.secrets.find((s) => s.name === setup.secret);
  const toggle = <T extends string>(list: T[], id: T): T[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <form className="ag-setup" onSubmit={(e) => { e.preventDefault(); if (!problem) onRun(merged); }} noValidate>
      <Field label="Agent Card URL" required error={urlOk ? undefined : 'Enter an http(s) URL, usually ending in /.well-known/agent-card.json.'} help="Microcks reads the card, then calls each interface listed in supportedInterfaces.">
        {(c) => <Input {...c} mono value={setup.cardUrl} onChange={(e) => setSetup({ ...setup, cardUrl: e.target.value })} />}
      </Field>
      <fieldset className="ag-choices">
        <legend>Transports</legend>
        {defaults.transports.map((t) => (
          <Checkbox
            key={t.id}
            label={`${t.label}${t.preferred ? ' · preferred' : ''}`}
            description={`${t.sub} · ${t.url}`}
            checked={setup.transports.includes(t.id)}
            onChange={() => setSetup({ ...setup, transports: toggle(setup.transports, t.id) })}
          />
        ))}
      </fieldset>
      <fieldset className="ag-choices">
        <legend>Conversations · {setup.conversations.length} of {defaults.conversations.length}</legend>
        {defaults.conversations.map((c) => (
          <Checkbox
            key={c.id}
            label={c.id}
            description={`skill ${c.skillId} · ${c.turns} · expects ${c.expect}`}
            checked={setup.conversations.includes(c.id)}
            onChange={() => setSetup({ ...setup, conversations: toggle(setup.conversations, c.id) })}
          />
        ))}
      </fieldset>
      <Field label="Secret" help={secret?.help}>
        {(c) => (
          <Select {...c} value={setup.secret} onChange={(e) => setSetup({ ...setup, secret: e.target.value })}>
            {defaults.secrets.map((s) => <option key={s.name} value={s.name}>{s.name || 'None'}</option>)}
          </Select>
        )}
      </Field>
      <Field label="Timeout (ms)" required error={timeoutOk ? undefined : 'Enter a number of milliseconds greater than 0.'} help="Per agent message, not per conversation. LLM agents can take several seconds to answer.">
        {(c) => <Input {...c} inputMode="numeric" value={timeout} onChange={(e) => setTimeoutText(e.target.value)} />}
      </Field>
      <RadioGroup
        legend="Text comparison"
        value={setup.textMode}
        onChange={(v) => setSetup({ ...setup, textMode: v as 'contains' | 'regex' })}
        options={[
          { value: 'contains', label: 'Contains', description: '"Millefeuille" in the answer' },
          { value: 'regex', label: 'Regex', description: '/mille-?feuille/i' },
        ]}
      />
      <Checkbox label="Validate data parts against their JSON Schema" checked={setup.dataSchema} onChange={(e) => setSetup({ ...setup, dataSchema: e.target.checked })} />
      <div className="ex-row">
        <Button type="submit" icon="play" disabled={Boolean(problem)} aria-describedby="ag-run-help">Run the test</Button>
        <span id="ag-run-help" className="ex-small ex-secondary">{problem ?? setupSummary(merged)}</span>
      </div>
    </form>
  );
}

function resultAt(checks: AgentCheck[], tick: number, running: boolean, i: number): CheckResult {
  const c = checks[i];
  if (!c) return 'queued';
  if (i < tick) return c.result;
  return running && i === tick ? 'running' : 'queued';
}

function Detail({ detail }: { detail: AgentCheckDetail }) {
  return (
    <section className="ex-stack" aria-label={`Detail of ${detail.title}`}>
      <h2 style={{ margin: 0, fontSize: "var(--text-lg, 1.125rem)" }}>{detail.title}</h2>
      <p className="ex-small ex-mono ex-secondary" style={{ margin: 0 }}>{detail.sub}</p>
      {detail.kind === 'summary' ? (
        <>
          <dl className="dl">
            {detail.rows.map((r) => (
              <div key={r.label}><dt>{r.label}</dt><dd>{r.value}{TONE_WORD[r.tone] ? <span className="sr-only"> ({TONE_WORD[r.tone]})</span> : null}</dd></div>
            ))}
          </dl>
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>{detail.note}</p>
        </>
      ) : null}
      {detail.kind === 'lanes' ? (
        <>
          <TaskLanes lanes={detail.lanes} />
          {detail.exchanges.map((x, i) => (
            <div key={i} className="ag-exchange" data-highlight={x.highlight ? '' : undefined}>
              <p className="ex-row-between" style={{ margin: 0 }}>
                <span className="ex-mono ex-small">{x.head}</span>
                <span className="ex-small">{x.status}</span>
              </p>
              <div className="ag-exchange-cols">
                <div><strong className="ex-small">Request</strong>{x.request.map((l, j) => <div key={j} className="ag-ln" data-kind={l.kind}>{l.kind === 'ok' ? '✓ ' : ''}{l.text}</div>)}</div>
                <div><strong className="ex-small">Response</strong>{x.response.map((l, j) => <div key={j} className="ag-ln" data-kind={l.kind}>{l.kind === 'bad' ? '✕ ' : ''}{l.text}</div>)}</div>
              </div>
            </div>
          ))}
        </>
      ) : null}
      {detail.kind === 'stream' ? (
        <ol className="ag-events" aria-label="Events of the stream">
          {detail.events.map((e, i) => (
            <li key={i} data-expected={e.expected ? '' : undefined} data-bad={e.mark === 'x' ? '' : undefined}>
              <span className="ex-mono ex-small">{e.at}</span>
              <span className="ex-stack" style={{ gap: 2 }}>
                <span><strong className="ex-mono">{e.mark === 'x' ? '✕ ' : e.mark === '+' ? '+ expected: ' : ''}{e.kind}</strong> <span className="ex-small ex-secondary">{e.detail}</span></span>
                <span className="ex-row">{e.flags.map((f) => <span key={f.text} className="ex-small ex-mono">{f.tone === 'bad' ? '✕ ' : f.tone === 'ok' ? '✓ ' : ''}{f.text}</span>)}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function Results({ run, phase, tick, onSkip, onEdit, onReplay }: { run: AgentTestRunWithDetails; phase: 'running' | 'done'; tick: number; onSkip: () => void; onEdit: () => void; onReplay: () => void }) {
  const announce = useAnnounce();
  const running = phase === 'running';
  const n = run.checks.length;
  const shown = running ? tick : n;
  const [chosen, setChosen] = useState<string | null>(null);
  const revealed = run.checks.slice(0, shown);
  const firstFail = run.failures[0];
  const autoKey = !running && firstFail ? cellKey(firstFail.row, firstFail.transport) : revealed.length > 0 ? cellKey(revealed[revealed.length - 1]?.row ?? '', revealed[revealed.length - 1]?.transport ?? '*') : '';
  const selectedKey = chosen === null ? autoKey : chosen;
  const detail = selectedKey && run.checks.findIndex((c) => cellKey(c.row, c.transport) === selectedKey) < shown ? run.details[selectedKey] : undefined;
  const indexOf = (row: string, transport: string) => run.checks.findIndex((c) => c.row === row && c.transport === transport);
  const transports = run.setup.transports;
  const columns = transports.map((t) => ({ id: t, label: TRANSPORT_LABEL[t].label, sub: TRANSPORT_LABEL[t].sub }));

  const cellsFor = (row: string, perTransport: boolean): MatrixRow['cells'] => {
    const cell = (transport: string) => {
      const i = indexOf(row, transport);
      const result = resultAt(run.checks, shown, running, i);
      const done = result === 'pass' || result === 'fail' || result === 'warn';
      return { columnId: transport === '*' ? undefined : transport, result, duration: done ? fmtMs(run.checks[i]?.ms ?? 0) : undefined };
    };
    return perTransport ? transports.map((t) => cell(t)) : [cell('*')];
  };
  const groups: MatrixGroup[] = [
    { id: 'card', label: 'Agent Card', sub: '/.well-known/agent-card.json · checked once, then per interface', rows: CARD_ROWS.map((r) => ({ id: r.id, label: r.label, sub: r.sub, cells: cellsFor(r.id, r.perTransport) })) },
    {
      id: 'conversations', label: 'Behaviour · conversations', sub: `${run.setup.conversations.length} replayed · task states, artifacts, streaming, loose text match`,
      rows: run.setup.conversations.map((c) => ({ id: c, label: c, mono: true, cells: cellsFor(c, true) })),
    },
  ];
  const footer = {
    label: 'Conversations passed',
    cells: transports.map((t) => {
      const rows = run.setup.conversations;
      const fin = rows.filter((c) => indexOf(c, t) < shown);
      const ok = fin.filter((c) => run.checks[indexOf(c, t)]?.result === 'pass').length;
      return { text: fin.length ? `${ok}/${rows.length}` : `—/${rows.length}`, tone: fin.length && ok < fin.length ? ('danger' as const) : fin.length === rows.length ? ('success' as const) : undefined };
    }),
  };
  const totals = totalsOf(revealed);
  const all = totalsOf(run.checks);
  const passed = agentRunPassed(run.checks);
  const progressText = `${totals.pass} passed, ${totals.fail} failed, ${totals.warn} warning, ${n - shown} remaining of ${n} checks`;
  const cli = `microcks test 'Pastry concierge:1.0' https://concierge.staging.acme.io A2A_CONFORMANCE --microcksURL=http://microcks.local:8080/api/ --waitFor=30sec`;
  const elapsed = 120 + revealed.reduce((a, c) => a + c.ms + 40, 0);

  useEffect(() => {
    if (!running) announce(`Test finished. ${all.conversationPassed} of ${all.conversationTotal} conversation checks passed.`);
  }, [running, announce, all.conversationPassed, all.conversationTotal]);

  return (
    <div className="ex-stack">
      <div className="ex-row-between">
        <div className="ex-stack" style={{ gap: 4 }}>
          {running ? <StatusBadge status="running" label={`Running · check ${Math.min(tick + 1, n)} of ${n}`} /> : <StatusBadge status={passed ? 'conformant' : 'failed'} label={passed ? 'Passed' : 'Failed'} />}
          <p className="ex-small ex-secondary" style={{ margin: 0 }}>
            <span className="ex-mono">{run.setup.cardUrl}</span> · {transports.map((t) => TRANSPORT_LABEL[t].label).join(' · ')} · {run.setup.conversations.length} conversations · secret {run.setup.secret || 'none'} · {run.setup.timeoutMs} ms ·{' '}
            {run.setup.textMode}{run.setup.dataSchema ? ' + JSON Schema' : ''} · {running ? 'Elapsed' : 'Duration'} {fmtMs(elapsed)}
          </p>
        </div>
        <span className="ex-row">
          {running ? <Button variant="secondary" onClick={onSkip}>Skip to the result</Button> : <Button variant="secondary" onClick={onReplay}>Replay</Button>}
          <Button variant="ghost" onClick={onEdit}>Edit the setup</Button>
        </span>
      </div>
      <div role="img" aria-label={`Progress: ${progressText}`} className="ag-segs">
        {run.checks.map((_c, i) => {
          const r = resultAt(run.checks, shown, running, i);
          return <span key={i} data-state={r === 'running' ? 'run' : r === 'queued' ? '' : r} />;
        })}
      </div>
      <p className="ex-small ex-secondary" style={{ margin: 0 }}>{progressText}</p>
      {!running ? (
        <Callout tone={passed ? 'success' : 'danger'} title={`${all.conversationPassed} of ${all.conversationTotal} conversation checks passed`}>
          <p>
            {passed ? 'on every transport' : `${all.conversationFailed} failed on the task contract, each on a single transport`} · {run.setup.conversations.length} conversations × {transports.length} transports · Agent Card: {all.pass - all.conversationPassed} passed, {all.warn} warning
          </p>
          {run.failures.length > 0 ? (
            <ul>
              {run.failures.map((f) => (
                <li key={`${f.row}|${f.transport}`}>
                  <button type="button" className="ag-pickbtn" onClick={() => setChosen(cellKey(f.row, f.transport))}>{TRANSPORT_LABEL[f.transport].label} × {f.row}</button> · {f.cause}
                </li>
              ))}
            </ul>
          ) : null}
        </Callout>
      ) : null}
      <ul className="ex-plain-list" aria-label="Score by transport">
        {transports.map((t) => {
          const s = transportScore(revealed, t);
          return <li key={t} className="ex-row"><strong>{TRANSPORT_LABEL[t].label}</strong> <span>{s.passed}/{run.setup.conversations.length} conversations passed</span></li>;
        })}
      </ul>
      <ConformanceMatrix
        caption={`Checks of test #${run.id}: Agent Card, then conversations, by transport`}
        columns={columns}
        groups={groups}
        footer={footer}
        selectedKey={selectedKey || undefined}
        onSelectCell={(k) => setChosen(k ?? '')}
      />
      {detail ? <Detail detail={detail} /> : <p className="ex-small ex-secondary">{running ? 'Select a finished check to read its detail.' : 'Select a cell of the matrix to read its detail.'}</p>}
      <Disclosure summary="Runner log" defaultOpen={running}>
        <ol className="ag-log" aria-label="Runner log">
          <li><span className="ex-muted">08:10:04.214</span><span>INFO</span><span>Test #{run.id} started · runner A2A_CONFORMANCE · {transports.length} transports · {run.setup.conversations.length} conversations</span></li>
          {revealed.map((c, i) => (
            <li key={i}>
              <span className="ex-muted">+{fmtMs(c.ms)}</span>
              <span>{c.result === 'pass' ? 'PASS' : c.result === 'fail' ? 'FAIL' : 'WARN'}</span>
              <span>{c.transport === '*' ? '' : `${TRANSPORT_LABEL[c.transport].label} × `}{c.row}</span>
            </li>
          ))}
          {!running ? <li><span className="ex-muted">end</span><span>INFO</span><span>Test #{run.id} completed in {fmtMs(elapsed)} · {all.conversationPassed}/{all.conversationTotal} conversation checks passed</span></li> : null}
        </ol>
      </Disclosure>
      {!running ? (
        <Disclosure summary="Run it in CI">
          <CodeBlock code={cli} language="bash" caption="Microcks CLI" />
        </Disclosure>
      ) : null}
    </div>
  );
}

/** Screen 19: configure, run and read an A2A conformance test (Agent Card, then conversations by transport). */
export default function AgentTestRunPage() {
  const { runId } = useParams();
  const [search] = useSearchParams();
  const serviceId = search.get('service') ?? 'concierge';
  const uc = useUseCases();
  const defaults = useQuery(() => uc.agents.testDefaults(serviceId), [uc, serviceId]);
  const stored = useQuery(() => (runId ? uc.agents.getTestRun(runId) : Promise.resolve(undefined)), [uc, runId]);
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>(runId ? 'done' : 'setup');
  const [run, setRun] = useState<AgentTestRunWithDetails | undefined>();
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const current = run ?? stored.data;
  usePageTitle(phase === 'setup' ? 'Test the agent · Microcks' : `Agent test #${current?.id ?? ''} · Microcks`);

  const n = current?.checks.length ?? 0;
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = setInterval(() => {
      setTick((t) => {
        if (t + 1 >= n) {
          setPhase('done');
          return n;
        }
        return t + 1;
      });
    }, 700);
    return () => clearInterval(timer);
  }, [phase, n]);

  const start = useMemo(
    () => async (setup: AgentTestSetup) => {
      try {
        const result = await uc.agents.runConformance(setup);
        setRun(result);
        setTick(0);
        setError('');
        setPhase('running');
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [uc],
  );

  const title = phase === 'setup' ? 'Test the agent' : `Agent test #${current?.id ?? ''}`;
  const header = (
    <PageHeader
      title={title}
      breadcrumb={[{ label: 'APIs & Services', to: '/services' }, { label: 'Pastry concierge 1.0', to: `/services/${serviceId}/skills` }, { label: 'Agent test' }]}
      badge={<ApiBadge protocol="A2A" name="Pastry concierge" version="1.0" />}
      actions={<Button asChild variant="secondary"><RouterLink to={`/tests/service/${serviceId}`}>Test history</RouterLink></Button>}
    />
  );

  if (defaults.status === 'error' && !defaults.data) return <>{header}<ErrorBlock error={defaults.error} what="The agent" onRetry={defaults.reload} /></>;
  if (!defaults.data) return <>{header}<LoadingBlock label="the test form" /></>;
  if (runId && stored.status === 'error' && !stored.data) return <>{header}<ErrorBlock error={stored.error} what="The test run" onRetry={stored.reload} /></>;
  if (phase !== 'setup' && !current) return <>{header}<LoadingBlock label="the test run" /></>;

  return (
    <div className="ex-stack">
      {header}
      {error ? <Callout tone="danger" title="The test could not start" live="assertive"><p>{error}</p></Callout> : null}
      {phase === 'setup' || !current ? (
        <>
          <p className="ex-secondary" style={{ margin: 0 }}>
            <Icon name="info" size={14} /> Runner <span className="ex-mono">A2A_CONFORMANCE</span> · proposed, not available in Microcks today. It checks the Agent Card, then replays each conversation on every transport.
          </p>
          <Setup defaults={defaults.data} onRun={start} />
        </>
      ) : (
        <Results
          run={current}
          phase={phase}
          tick={tick}
          onSkip={() => setPhase('done')}
          onEdit={() => setPhase('setup')}
          onReplay={() => { setTick(0); setPhase('running'); }}
        />
      )}
    </div>
  );
}
