/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- scrollable code regions must be reachable by keyboard (WCAG 2.1.1) */
import '../explore-kit/explore.css';
import './agent-test.css';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router';
import {
  AGENT_TRANSPORT_NAMES,
  agentCellName,
  agentElapsedMs,
  agentRunnerLog,
  agentRunPassed,
  cellKey,
  setupSummary,
  totalsOf,
  validateSetup,
  type AgentCheck,
  type AgentCheckDetail,
  type AgentTestDefaults,
  type AgentTestRunWithDetails,
  type AgentTestSetup,
  type DetailTone,
  type DetailVerdict,
  type TransportId,
} from '@/domain/agents';
import { formatClock } from '@/domain/shared';
import { PAGE_TITLE_ID, PageHeader, useAnnounce, usePageTitle, useQuery, useRelativeTime, useUseCases } from '@/ui/app';
import { ApiBadge } from '@/ui/components/ui/api-badge';
import { Button } from '@/ui/components/ui/button';
import { Callout } from '@/ui/components/ui/callout';
import { Checkbox, Radio } from '@/ui/components/ui/checkbox';
import { ConformanceMatrix, type CheckResult, type MatrixGroup, type MatrixRow } from '@/ui/components/ui/conformance-matrix';
import { CopyButton } from '@/ui/components/ui/copy-button';
import { Field } from '@/ui/components/ui/field';
import { Icon } from '@/ui/components/ui/icon';
import { Input } from '@/ui/components/ui/input';
import { LiveIndicator } from '@/ui/components/ui/live-indicator';
import { RunProgress, type RunSegment } from '@/ui/components/ui/run-progress';
import { RunnerLog, type RunnerLevel } from '@/ui/components/ui/runner-log';
import { Select } from '@/ui/components/ui/select';
import { TaskLanes } from '@/ui/components/ui/task-timeline';
import { ErrorBlock, LoadingBlock } from '../explore-kit/states';

/** The runner fills one matrix cell every 800 ms, as in the prototype. */
const CHECK_MS = 800;
const CARD_ROWS: { id: string; label: string; sub: string; perTransport: boolean }[] = [
  { id: 'schema', label: 'Schema · required fields', sub: 'A2A v1.0 JSON Schema · name, version, supportedInterfaces, capabilities, skills…', perTransport: false },
  { id: 'iface', label: 'Interfaces reachable', sub: 'each supportedInterfaces entry answers with A2A-Version: 1.0', perTransport: true },
  { id: 'caps', label: 'Capabilities honoured', sub: 'streaming and pushNotifications declared true are exercised', perTransport: true },
  { id: 'sig', label: 'Signature (JWS)', sub: 'optional in v1.0 · absent is a warning, not an error', perTransport: false },
];
const TRANSPORT_SUB: Record<TransportId, string> = { jsonrpc: 'preferred · SSE', http: 'SSE', grpc: 'stream' };
const RESULT_WORD: Record<'pass' | 'fail' | 'warn', string> = { pass: 'passed', fail: 'failed', warn: 'absent' };
const SEGMENT: Record<CheckResult, RunSegment> = { pass: 'done', fail: 'failed', warn: 'warn', running: 'current', queued: 'queued' };
const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`);
const TONE_WORD: Record<DetailTone, string> = { ok: 'ok', bad: 'problem', warn: 'warning', muted: '', plain: '' };
const CLI = "microcks test 'Pastry concierge:1.0' https://concierge.staging.acme.io A2A_CONFORMANCE --microcksURL=http://microcks.local:8080/api/ --waitFor=30sec";

/** Text with `code` segments between backticks. */
function Coded({ text }: { text: string }) {
  return (
    <>
      {text.split('`').map((part, i) => (i % 2 === 1 ? <code key={i} className="mono">{part}</code> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

function Setup({ defaults, initial, onRun }: { defaults: AgentTestDefaults; initial: AgentTestSetup; onRun: (setup: AgentTestSetup) => void }) {
  const [setup, setSetup] = useState<AgentTestSetup>(initial);
  const [timeout, setTimeoutText] = useState(String(initial.timeoutMs));
  const merged: AgentTestSetup = { ...setup, timeoutMs: Number.parseInt(timeout, 10) };
  const problem = validateSetup(merged);
  const urlOk = /^https?:\/\/\S+$/.test(setup.cardUrl.trim());
  const timeoutOk = timeout.trim() !== '' && Number.isFinite(merged.timeoutMs) && merged.timeoutMs > 0;
  const secret = defaults.secrets.find((s) => s.name === setup.secret);
  const toggle = <T extends string>(list: T[], id: T): T[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return (
    <section aria-labelledby="setup-title" className="setup-card">
      <div className="setup-card-head">
        <h2 id="setup-title">Test a real agent against its card</h2>
        <p>
          Microcks reads the Agent Card, checks it, then replays each conversation of the <span className="mono">APIExamples</span> artifact on every selected transport.
          The transport result and the task state are judged separately: a <span className="mono">200 OK</span> carrying a <span className="mono">failed</span> task is
          still a failure.
        </p>
      </div>
      <form className="setup-grid" onSubmit={(e) => { e.preventDefault(); if (!problem) onRun(merged); }} noValidate>
        <div className="setup-col" data-col="main">
          <Field label="Agent Card URL" error={urlOk ? undefined : 'Enter an http(s) URL, usually ending in /.well-known/agent-card.json.'} help={urlOk ? 'Microcks reads the card, then calls each interface listed in supportedInterfaces.' : undefined} className="setup-url">
            {(c) => <Input {...c} required type="url" spellCheck={false} autoComplete="off" mono value={setup.cardUrl} onChange={(e) => setSetup({ ...setup, cardUrl: e.target.value })} />}
          </Field>
          <fieldset className="setup-fieldset">
            <legend>
              Transports to test <span className="setup-legend-hint">· read from <span className="mono">supportedInterfaces</span></span>
            </legend>
            <div className="transport-choices">
              {defaults.transports.map((t) => (
                <Checkbox
                  key={t.id}
                  variant="card"
                  className="transport-choice-input"
                  label={<span className="transport-choice-name">{t.label}{t.preferred ? <span className="preferred-chip">preferred</span> : null}</span>}
                  description={<><span>{t.sub}</span><span className="transport-choice-url">{t.url}</span></>}
                  checked={setup.transports.includes(t.id)}
                  onChange={() => setSetup({ ...setup, transports: toggle(setup.transports, t.id) })}
                />
              ))}
            </div>
          </fieldset>
          <fieldset className="setup-fieldset">
            <legend>
              Conversations to replay{' '}
              <span className="setup-legend-hint">
                · {setup.conversations.length} of {defaults.conversations.length} selected · from <span className="mono">pastry-concierge-1.0-examples.yaml</span>
              </span>
            </legend>
            <div className="conversation-list">
              {defaults.conversations.map((c) => (
                <label key={c.id} className="conversation-option">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={setup.conversations.includes(c.id)}
                    onChange={() => setSetup({ ...setup, conversations: toggle(setup.conversations, c.id) })}
                  />
                  <span className="conversation-option-id">{c.id}</span>
                  <span className="conversation-option-skill"><span className="muted">skill</span><span className="mono" data-none={c.skillId === '(none)' ? '' : undefined}>{c.skillId}</span></span>
                  <span className="conversation-option-turns">{c.turns}</span>
                  <span className="conversation-option-expect"><span className="muted">expects</span><span className="mono">{c.expect}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="setup-col" data-col="side">
          <Field label="Secret" help={secret?.help} className={secret?.matches ? 'setup-secret' : 'setup-secret setup-secret-warn'}>
            {(c) => (
              <Select {...c} value={setup.secret} onChange={(e) => setSetup({ ...setup, secret: e.target.value })}>
                {defaults.secrets.map((s) => <option key={s.name} value={s.name}>{s.name || 'No secret'}</option>)}
              </Select>
            )}
          </Field>
          <Field
            label={<>Timeout per message <span className="muted setup-unit">(ms)</span></>}
            error={timeoutOk ? undefined : 'Enter a number of milliseconds greater than 0.'}
            help={timeoutOk ? 'Per agent message, not per conversation. LLM agents can take several seconds to answer.' : undefined}
            className="setup-timeout"
          >
            {(c) => <Input {...c} required mono inputMode="numeric" value={timeout} onChange={(e) => setTimeoutText(e.target.value)} />}
          </Field>
          <fieldset className="setup-compare">
            <legend>Compare agent text loosely</legend>
            <p>LLM agents rephrase their answers from one call to the next, so Microcks never checks agent text for strict equality. Choose how the expected text of each conversation is matched.</p>
            <div className="setup-modes">
              {[
                { value: 'contains' as const, label: 'Contains', example: '"Millefeuille" in the answer' },
                { value: 'regex' as const, label: 'Regex', example: '/mille-?feuille/i' },
              ].map((m) => (
                <Radio
                  key={m.value}
                  variant="card"
                  name="text-mode"
                  value={m.value}
                  label={m.label}
                  description={<span className="mono">{m.example}</span>}
                  checked={setup.textMode === m.value}
                  onChange={() => setSetup({ ...setup, textMode: m.value })}
                />
              ))}
            </div>
            <Checkbox
              variant="card"
              label={<>Validate <span className="mono">data</span> parts with JSON Schema</>}
              description={<>Structured answers such as <span className="mono">{'{name, price, reason}'}</span> are checked for shape, not for exact values.</>}
              checked={setup.dataSchema}
              onChange={(e) => setSetup({ ...setup, dataSchema: e.target.checked })}
            />
          </fieldset>
          <div className="setup-run">
            <Button type="submit" variant="primary" icon="play" disabled={Boolean(problem)} aria-describedby="setup-run-help">Run test</Button>
            <span id="setup-run-help" className="setup-run-help" data-problem={problem ? '' : undefined}>{problem ?? setupSummary(merged)}</span>
          </div>
        </div>
      </form>
    </section>
  );
}

function resultAt(checks: AgentCheck[], tick: number, running: boolean, i: number): CheckResult {
  const c = checks[i];
  if (!c) return 'queued';
  if (i < tick) return c.result;
  return running && i === tick ? 'running' : 'queued';
}

function VerdictBox({ verdict }: { verdict: DetailVerdict }) {
  return (
    <div className="verdict-box">
      <Icon name="cross" size={15} />
      <span>
        <span className="verdict-box-title"><Coded text={verdict.title} /></span>
        <span className="verdict-box-body"><Coded text={verdict.body} /></span>
      </span>
    </div>
  );
}

function Detail({ detail, check, onClose }: { detail: AgentCheckDetail; check: AgentCheck; onClose: () => void }) {
  const card = CARD_ROWS.some((r) => r.id === check.row);
  const result = check.result;
  return (
    <section className="cell-detail" data-result={result} aria-label={`Detail of ${detail.title}`}>
      <div className="cell-detail-head">
        <div className="cell-detail-title">
          <h3>{detail.title}</h3>
          <span className="cell-detail-sub">{detail.sub}</span>
        </div>
        <div className="cell-detail-actions">
          <ApiBadge label={card ? 'agent card' : 'conversation'} value={RESULT_WORD[result]} status={result === 'pass' ? 'success' : result === 'fail' ? 'danger' : 'warning'} />
          <Button size="sm" iconOnly icon="close" aria-label="Close cell detail" className="cell-detail-close" onClick={onClose} />
        </div>
      </div>
      {detail.kind === 'summary' ? (
        <>
          <dl className="cell-facts">
            {detail.rows.map((r) => (
              <div key={r.label}>
                <dt>{r.label}</dt>
                <dd data-tone={r.tone}>{r.value}{TONE_WORD[r.tone] ? <span className="sr-only"> ({TONE_WORD[r.tone]})</span> : null}</dd>
              </div>
            ))}
          </dl>
          {detail.note ? <p className="cell-detail-note">{detail.note}</p> : null}
        </>
      ) : null}
      {detail.kind === 'lanes' ? (
        <>
          <div className="detail-block">
            <h4 className="detail-block-title">Task lifecycle · expected versus actual</h4>
            <div className="lifecycle-box">
              <TaskLanes lanes={detail.lanes} />
              {detail.note ? (
                <p className="lifecycle-note"><Icon name="arrow-up" size={13} />{detail.note}</p>
              ) : null}
            </div>
          </div>
          {detail.verdict ? <VerdictBox verdict={detail.verdict} /> : null}
          <div className="detail-block">
            <h4 className="detail-block-title">Raw HTTP exchange · {detail.exchanges.length} calls</h4>
            {detail.exchanges.map((x, i) => (
              <div key={i} className="exchange" data-highlight={x.highlight ? '' : undefined}>
                <div className="exchange-head">
                  <span className="exchange-call">{x.head}</span>
                  <span className="exchange-status" data-tone={x.statusTone}>{x.status}</span>
                </div>
                <div className="exchange-cols">
                  {[{ label: 'Request', lines: x.request }, { label: 'Response', lines: x.response }].map((side) => (
                    <div key={side.label} className="exchange-side" tabIndex={0} role="group" aria-label={`${side.label} of ${x.head}`}>
                      <div className="exchange-side-inner">
                        <span className="exchange-label">{side.label}</span>
                        {side.lines.map((l, j) => (
                          <div key={j} className="exchange-line" data-kind={l.kind}>
                            <span className="exchange-mark" aria-hidden="true">{l.kind === 'ok' ? '✓' : l.kind === 'bad' ? '✕' : ''}</span>
                            <span>{l.text}</span>
                            {l.kind === 'ok' || l.kind === 'bad' ? <span className="sr-only"> ({l.kind === 'ok' ? 'expected' : 'wrong'})</span> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
      {detail.kind === 'stream' ? (
        <>
          <div className="detail-block">
            <h4 className="detail-block-title">Received stream · a2a.v1.A2AService/SendStreamingMessage</h4>
            <ol className="stream-events">
              {detail.events.map((e, i) => (
                <li key={i} data-expected={e.expected ? '' : undefined} data-bad={e.mark === 'x' ? '' : undefined} data-kind={e.kind === 'request' ? 'request' : e.kind === 'stream closed' ? 'closed' : undefined}>
                  <span className="stream-at">{e.at}</span>
                  <span className="stream-mark" aria-hidden="true">{e.mark === 'x' ? '✕' : e.mark === '+' ? '+' : ''}</span>
                  {e.mark ? <span className="sr-only">{e.mark === 'x' ? 'Wrong: ' : 'Missing: '}</span> : null}
                  <span className="stream-kind">{e.kind}</span>
                  <span className="stream-detail">{e.detail}</span>
                  <span className="stream-flags">
                    {e.flags.map((f) => <span key={f.text} className="stream-flag" data-tone={f.tone}>{f.text}</span>)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          {detail.verdict ? <VerdictBox verdict={detail.verdict} /> : null}
        </>
      ) : null}
    </section>
  );
}

interface ResultsProps {
  run: AgentTestRunWithDetails;
  phase: 'running' | 'done';
  tick: number;
  /** "skill recommend-pastry · 1 turn · expects completed", by conversation id. */
  conversationSubs: Record<string, string>;
  onStep: () => void;
  onReplay: () => void;
  onEdit: () => void;
}

function Results({ run, phase, tick, conversationSubs, onStep, onReplay, onEdit }: ResultsProps) {
  const announce = useAnnounce();
  const running = phase === 'running';
  const n = run.checks.length;
  const shown = running ? tick : n;
  const [chosen, setChosen] = useState<string | null>(null);
  const [ciOpen, setCiOpen] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const revealed = run.checks.slice(0, shown);
  const firstFail = run.failures[0];
  const last = revealed[revealed.length - 1];
  const autoKey = !running && firstFail ? cellKey(firstFail.row, firstFail.transport) : last ? cellKey(last.row, last.transport) : '';
  const selectedKey = chosen === null ? autoKey : chosen;
  const selectedIndex = selectedKey ? run.checks.findIndex((c) => cellKey(c.row, c.transport) === selectedKey) : -1;
  const selectedCheck = selectedIndex >= 0 && selectedIndex < shown ? run.checks[selectedIndex] : undefined;
  const detail = selectedCheck ? run.details[selectedKey] : undefined;
  const indexOf = (row: string, transport: string) => run.checks.findIndex((c) => c.row === row && c.transport === transport);
  const { transports, conversations } = run.setup;
  const columns = transports.map((t) => ({ id: t, label: AGENT_TRANSPORT_NAMES[t], sub: TRANSPORT_SUB[t] }));

  const cellsFor = (row: string, perTransport: boolean): MatrixRow['cells'] => {
    const cell = (transport: string) => {
      const i = indexOf(row, transport);
      const result = resultAt(run.checks, shown, running, i);
      const done = result === 'pass' || result === 'fail' || result === 'warn';
      return { columnId: transport === '*' ? undefined : transport, result, label: result === 'warn' ? 'Absent' : undefined, duration: done ? fmtMs(run.checks[i]?.ms ?? 0) : undefined };
    };
    return perTransport ? transports.map((t) => cell(t)) : [cell('*')];
  };
  const groups: MatrixGroup[] = [
    { id: 'card', label: 'Agent Card', sub: '/.well-known/agent-card.json · checked once, then per interface', rows: CARD_ROWS.map((r) => ({ id: r.id, label: r.label, sub: r.sub, cells: cellsFor(r.id, r.perTransport) })) },
    {
      id: 'conversations', label: 'Behaviour · conversations', sub: `${conversations.length} replayed · task states, artifacts, streaming, loose text match`,
      rows: conversations.map((c) => ({ id: c, label: c, sub: conversationSubs[c], mono: true, cells: cellsFor(c, true) })),
    },
  ];
  const footer = {
    label: 'Conversations passed',
    cells: transports.map((t) => {
      const fin = conversations.filter((c) => indexOf(c, t) < shown);
      const ok = fin.filter((c) => run.checks[indexOf(c, t)]?.result === 'pass').length;
      return { text: fin.length ? `${ok}/${conversations.length}` : `—/${conversations.length}`, tone: fin.length && ok < fin.length ? ('danger' as const) : fin.length === conversations.length ? ('success' as const) : undefined };
    }),
  };
  const states = run.checks.map((_c, i) => resultAt(run.checks, shown, running, i));
  const count = (r: CheckResult) => states.filter((s) => s === r).length;
  const all = totalsOf(run.checks);
  const cardRows = CARD_ROWS.map((r) => run.checks.filter((c) => c.row === r.id));
  const cardPassed = cardRows.filter((cs) => cs.length > 0 && cs.every((c) => c.result === 'pass')).length;
  const ratio = all.conversationPassed / Math.max(1, all.conversationTotal);
  const scoreLevel = all.conversationFailed === 0 ? 'high' : ratio >= 0.8 ? 'mid' : 'low';
  const current = running ? run.checks[tick] : undefined;
  const log = agentRunnerLog(run, shown, running);

  useEffect(() => {
    if (!running) announce(`Test finished. ${all.conversationPassed} of ${all.conversationTotal} conversation checks passed.`);
  }, [running, announce, all.conversationPassed, all.conversationTotal]);

  /** Closing the detail returns the focus to the selected cell, so it never drops to the page body. */
  const closeDetail = () => {
    const cell = areaRef.current?.querySelector<HTMLButtonElement>('button.matrix-cell[aria-pressed="true"]');
    setChosen('');
    cell?.focus();
  };

  return (
    <>
      <div className="setup-strip">
        <span className="setup-strip-label">Setup</span>
        <span className="setup-strip-text">{transports.map((t) => AGENT_TRANSPORT_NAMES[t]).join(' · ')}</span>
        <span className="setup-strip-text">{conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}</span>
        <span><span className="muted">secret</span> <span className="mono">{run.setup.secret || 'none'}</span></span>
        <span><span className="muted">timeout</span> <span className="mono">{run.setup.timeoutMs} ms</span></span>
        <span><span className="muted">text</span> <span className="mono">{run.setup.textMode}{run.setup.dataSchema ? ' + JSON Schema' : ''}</span></span>
        {!running ? <Button size="sm" icon="pencil" className="edit-setup" onClick={onEdit}>Edit setup</Button> : null}
      </div>
      <div className="run-top">
        {running ? (
          <RunProgress
            className="run-top-main"
            done={tick}
            total={n}
            caption="matrix cells filled"
            nowLabel="Now checking"
            now={current ? agentCellName(current.row, current.transport) : 'Computing the conformance score…'}
            segments={states.map((s) => SEGMENT[s])}
            gap={3}
            counts={[
              { kind: 'pass', text: `${count('pass')} passed` },
              { kind: 'fail', text: `${count('fail')} failed` },
              { kind: 'warn', text: `${count('warn')} warning` },
              { kind: 'pending', text: `${count('queued') + count('running')} queued` },
            ]}
            action={<Button size="sm" icon="chevron" className="step-forward" onClick={onStep}>Step forward</Button>}
            note={<>Agent Card checks run first. Each conversation then runs once per transport, with a fresh <span className="mono">contextId</span> per run and the OAuth2 token from the secret.</>}
          />
        ) : (
          <section aria-label="Summary" className="run-summary run-top-main">
            <div className="run-summary-head">
              <div className="run-score">
                <span className="run-score-value" data-level={scoreLevel}>
                  {all.conversationPassed}<span className="run-score-total">/{all.conversationTotal}</span>
                </span>
                <span className="run-score-caption">conversation checks passed · {conversations.length} conversations × {transports.length} transports</span>
              </div>
              <div className="run-summary-text">
                <span className="run-summary-line">
                  {all.conversationPassed} of {all.conversationTotal} checks passed
                  {all.conversationFailed ? ` · ${all.conversationFailed} failed on the task contract, each on a single transport` : ' on every transport'}
                </span>
                <span className="run-summary-card">
                  <span className="muted">Agent Card</span>
                  <span data-tone="success"><Icon name="check" size={12} />{cardPassed} passed</span>
                  {all.warn ? <span data-tone="warning"><Icon name="warning" size={12} />{all.warn} warning · signature absent</span> : null}
                </span>
                {run.failures.map((f) => (
                  <button key={`${f.row}|${f.transport}`} type="button" className="failure-link" onClick={() => setChosen(cellKey(f.row, f.transport))}>
                    <Icon name="cross" size={13} />
                    <span><span className="failure-link-cell">{AGENT_TRANSPORT_NAMES[f.transport]} × {f.row}</span> · {f.cause}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="transport-scores">
              <span className="transport-scores-caption">Score per transport · one segment per conversation</span>
              <div className="transport-scores-row">
                {transports.map((t) => {
                  const results = conversations.map((c) => run.checks[indexOf(c, t)]?.result ?? 'pass');
                  const ok = results.filter((r) => r === 'pass').length;
                  return (
                    <div key={t} className="transport-score">
                      <div className="transport-score-head">
                        <span className="transport-score-name">{AGENT_TRANSPORT_NAMES[t]}</span>
                        <span className="transport-score-value" data-tone={ok === conversations.length ? 'success' : 'danger'}>{ok}/{conversations.length}</span>
                      </div>
                      <div className="transport-score-segs" aria-hidden="true">
                        {results.map((r, i) => <span key={i} data-result={r} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="run-actions">
              <Button asChild variant="primary"><RouterLink to={`/services/${run.setup.serviceId}`}>Open agent</RouterLink></Button>
              <Button icon="play" onClick={onReplay}>Run again</Button>
              <Button asChild><RouterLink to={`/tests/service/${run.setup.serviceId}`}>All runs</RouterLink></Button>
              <Button icon="code" className="ci-toggle" aria-expanded={ciOpen} aria-controls="ci-panel" onClick={() => setCiOpen(!ciOpen)}>Run it from CI</Button>
            </div>
            {ciOpen ? (
              <div id="ci-panel" role="region" aria-label="Run it from CI" className="ci-panel">
                <div className="ci-panel-head">
                  <span className="ci-panel-title">
                    <span className="ci-panel-name">
                      Run this test in your pipeline
                      <ApiBadge label="cli" value="proposed" status="warning" size="sm" />
                    </span>
                    <span className="ci-panel-hint">
                      Proposed, not available today: the existing <span className="mono">microcks test</span> command, unchanged, with the new runner name{' '}
                      <span className="mono">A2A_CONFORMANCE</span> that the A2A module would register. It exits non-zero when a check fails.
                    </span>
                  </span>
                  <CopyButton value={CLI} label="Copy command" />
                </div>
                <pre className="ci-panel-code" tabIndex={0} aria-label="Proposed microcks CLI command"><code>{CLI}</code></pre>
                <span className="ci-panel-hint">
                  Add <span className="mono">--keycloakClientId</span> and <span className="mono">--keycloakClientSecret</span> when your Microcks instance has authentication on.
                  The agent's OAuth2 token comes from the secret bound to the test, as in this run.
                </span>
              </div>
            ) : null}
          </section>
        )}
        <RunnerLog
          className="run-top-log"
          status={running ? <LiveIndicator variant="inline" label="live · streaming" /> : `${log.length} lines · completed`}
          // The registry log has no WARN level yet (asked to R4): the line keeps its text and level word.
          lines={log.map((l) => ({ time: l.time, level: l.level as RunnerLevel, text: l.text, emphasis: l.tone === 'emphasis', error: l.tone === 'error' }))}
        />
      </div>
      <section aria-labelledby="matrix-title" className="matrix-section" ref={areaRef}>
        <div className="matrix-section-head">
          <h2 id="matrix-title">Conformance matrix</h2>
          <span className="matrix-section-hint">checks × transports · select a finished cell to see the exchange</span>
          {running ? <LiveIndicator variant="inline" label="live · filling" /> : null}
        </div>
        <ConformanceMatrix
          caption={`Checks of run #${run.id}: Agent Card, then conversations, by transport`}
          columns={columns}
          groups={groups}
          footer={footer}
          selectedKey={detail ? selectedKey : undefined}
          onSelectCell={(k) => setChosen(k ?? '')}
        />
        {detail && selectedCheck ? (
          <Detail detail={detail} check={selectedCheck} onClose={closeDetail} />
        ) : (
          <p className="cell-detail-empty">Cells fill as checks finish. Select a finished cell to see what Microcks sent, what the agent answered, and why the check passed or failed.</p>
        )}
      </section>
    </>
  );
}

/** Screen 19: configure, run and read an A2A conformance test (Agent Card, then conversations by transport). */
export default function AgentTestRunPage() {
  const { runId } = useParams();
  const [search] = useSearchParams();
  const serviceId = search.get('service') ?? 'concierge';
  const uc = useUseCases();
  const relative = useRelativeTime();
  const defaults = useQuery(() => uc.agents.testDefaults(serviceId), [uc, serviceId]);
  const stored = useQuery(() => (runId ? uc.agents.getTestRun(runId) : Promise.resolve(undefined)), [uc, runId]);
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>(runId ? 'done' : 'setup');
  const [run, setRun] = useState<AgentTestRunWithDetails | undefined>();
  const [tick, setTick] = useState(0);
  /** Bumped by a replay, so the results start again from a fresh selection. */
  const [replays, setReplays] = useState(0);
  const [error, setError] = useState('');
  const current = run ?? stored.data;
  const id = phase === 'setup' && !current ? (defaults.data?.nextRunId ?? '') : (current?.id ?? '');
  usePageTitle(`Agent test #${id} · Microcks`);

  /** After a phase change the old controls are gone: move the focus to the title, never to the page body. */
  const focusTitle = useCallback(() => {
    requestAnimationFrame(() => document.getElementById(PAGE_TITLE_ID)?.focus());
  }, []);

  const n = current?.checks.length ?? 0;
  const step = useCallback(() => {
    setTick((t) => {
      if (t + 1 >= n) {
        setPhase('done');
        return n;
      }
      return t + 1;
    });
  }, [n]);
  useEffect(() => {
    if (phase !== 'running') return undefined;
    const timer = setInterval(step, CHECK_MS);
    return () => clearInterval(timer);
  }, [phase, step]);

  const start = useMemo(
    () => async (setup: AgentTestSetup) => {
      try {
        const result = await uc.agents.runConformance(setup);
        setRun(result);
        setTick(0);
        setError('');
        setPhase('running');
        focusTitle();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [uc, focusTitle],
  );

  const hasRun = phase !== 'setup' && Boolean(current);
  const running = phase === 'running';
  const elapsed = current ? agentElapsedMs(current.checks, running ? tick : current.checks.length) : 0;
  const passed = current ? agentRunPassed(current.checks) : true;
  const replay = () => { setTick(0); setReplays((r) => r + 1); setPhase('running'); };
  const skip = () => { setPhase('done'); focusTitle(); };
  const cardUrl = hasRun && current ? current.setup.cardUrl : (current?.setup.cardUrl ?? defaults.data?.setup.cardUrl ?? '');

  const badges = (
    <span className="run-badges">
      <RouterLink to={`/services/${serviceId}`} className="run-badge-link" aria-label="Agent Pastry concierge 1.0">
        <ApiBadge protocol="A2A" name="Pastry concierge 1.0" size="lg" />
      </RouterLink>
      <span className="projection-pill" title="A2A does not exist in Microcks today: this screen projects a protocol module for v2">Projection · v2 module</span>
      {!hasRun ? (
        <span role="status"><ApiBadge label="status" value="not started" /></span>
      ) : running ? (
        <>
          <LiveIndicator />
          <span role="status" className="run-running">
            <Icon name="running" size={15} className="run-spin" />
            Running · check {Math.min(tick + 1, n)} of {n}
          </span>
        </>
      ) : (
        <span role="status"><ApiBadge label="result" value={passed ? 'passed' : 'failed'} status={passed ? 'success' : 'danger'} /></span>
      )}
    </span>
  );
  const meta: ReactNode = (
    <span className="run-meta">
      <span><span className="run-meta-key">Endpoint</span><span className="run-meta-endpoint">{cardUrl}</span></span>
      <span><span className="run-meta-key">Runner</span><span className="run-meta-runner">A2A_CONFORMANCE</span></span>
      {hasRun && current ? (
        <>
          <span>
            <span className="run-meta-key">Started</span>
            <span>{relative(current.startedAt)}</span>
            <span className="run-meta-date">{formatClock(current.startedAt)}</span>
          </span>
          <span><span className="run-meta-key">{running ? 'Elapsed' : 'Duration'}</span><span className="run-meta-mono">{fmtMs(elapsed)}</span></span>
        </>
      ) : null}
      <span><span className="run-meta-key">Launched by</span><span>{current?.launchedBy ?? 'MA'}</span></span>
    </span>
  );
  const header = (
    <PageHeader
      title={`Run #${id}`}
      breadcrumb={[{ label: 'Tests', to: `/tests/service/${serviceId}` }, { label: 'Pastry concierge 1.0', to: `/services/${serviceId}` }, { label: `Run #${id}` }]}
      badge={badges}
      align="start"
      description={meta}
      actions={
        hasRun ? (
          <>
            <Button icon="reset" onClick={replay}>Replay run</Button>
            {running ? <Button variant="primary" icon="skip" onClick={skip}>Skip to result</Button> : null}
          </>
        ) : undefined
      }
    />
  );

  if (defaults.status === 'error' && !defaults.data) return <div className="agent-test">{header}<ErrorBlock error={defaults.error} what="The agent" onRetry={defaults.reload} /></div>;
  if (!defaults.data) return <div className="agent-test">{header}<LoadingBlock label="the test form" /></div>;
  if (runId && stored.status === 'error' && !stored.data) return <div className="agent-test">{header}<ErrorBlock error={stored.error} what="The test run" onRetry={stored.reload} /></div>;
  if (phase !== 'setup' && !current) return <div className="agent-test">{header}<LoadingBlock label="the test run" /></div>;

  return (
    <div className="agent-test">
      {header}
      {error ? <Callout tone="danger" title="The test could not start" live="assertive"><p>{error}</p></Callout> : null}
      {phase === 'setup' || !current ? (
        <Setup defaults={defaults.data} initial={current?.setup ?? defaults.data.setup} onRun={start} />
      ) : (
        <Results
          key={`${current.id}-${replays}`}
          run={current}
          phase={phase}
          tick={tick}
          conversationSubs={Object.fromEntries(defaults.data.conversations.map((c) => [c.id, `skill ${c.skillId} · ${c.turns} · expects ${c.expect}`]))}
          onStep={() => { if (tick + 1 >= n) focusTitle(); step(); }}
          onReplay={() => { replay(); focusTitle(); }}
          onEdit={() => { setPhase('setup'); focusTitle(); }}
        />
      )}
    </div>
  );
}
