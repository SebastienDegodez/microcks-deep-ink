import {
  AGENT_TRANSPORT_NAMES,
  cellKey,
  type AgentCheck,
  type AgentCheckResult,
  type AgentTestConversation,
  type AgentTestRun,
  type AgentTestSetup,
  type AgentTestTotals,
  type DetailTone,
  type TransportId,
} from '../../domain/agents/index.js';
import { formatClock } from '../../domain/shared/index.js';

/** State of a matrix cell: every value is a `CheckResult` of deep-ink. */
export type CellResult = AgentCheckResult | 'running' | 'queued';

/** Segment of the progress bar: every value is a `RunSegment` of deep-ink. */
export type ProgressSegment = 'done' | 'failed' | 'warn' | 'current' | 'queued';

/** Tone of a fact value: every value is a `FactTone` of deep-ink. */
export type DetailFactTone = 'success' | 'warning' | 'danger' | 'muted';

/** A transport column of the matrix, shaped like deep-ink's `MatrixColumn`. */
export interface RunMatrixColumn { id: string; label: string; sub?: string }

/** A cell of the matrix, shaped like deep-ink's `MatrixCell`. */
export interface RunMatrixCell { columnId?: string; result: CellResult; label?: string; duration?: string }

/** A check row of the matrix, shaped like deep-ink's `MatrixRow`. */
export interface RunMatrixRow { id: string; label: string; sub?: string; mono?: boolean; cells: RunMatrixCell[] }

/** A group of rows of the matrix, shaped like deep-ink's `MatrixGroup`. */
export interface RunMatrixGroup { id: string; label: string; sub?: string; rows: RunMatrixRow[] }

/** The summary row of the matrix, shaped like the `footer` of deep-ink's `ConformanceMatrix`. */
export interface RunMatrixFooter { label: string; cells: { text: string; tone?: 'success' | 'danger' }[] }

/** An item of the run header, shaped like deep-ink's `RunMetaItem`, with text values. */
export interface RunMetaEntry { term: string; value: string; kind?: 'text' | 'mono' | 'url' | 'chip'; detail?: string; id?: string }

/** The runner fills one matrix cell every 800 ms, as in the prototype. */
export const CHECK_MS = 800;

/** The Agent Card rows of the matrix: a `perTransport` row has one cell per transport, the others a single cell. */
export const CARD_ROWS: readonly { id: string; label: string; sub: string; perTransport: boolean }[] = [
  { id: 'schema', label: 'Schema · required fields', sub: 'A2A v1.0 JSON Schema · name, version, supportedInterfaces, capabilities, skills…', perTransport: false },
  { id: 'iface', label: 'Interfaces reachable', sub: 'each supportedInterfaces entry answers with A2A-Version: 1.0', perTransport: true },
  { id: 'caps', label: 'Capabilities honoured', sub: 'streaming and pushNotifications declared true are exercised', perTransport: true },
  { id: 'sig', label: 'Signature (JWS)', sub: 'optional in v1.0 · absent is a warning, not an error', perTransport: false },
];

/** Small text under each transport in the matrix head. */
export const TRANSPORT_SUB: Record<TransportId, string> = { jsonrpc: 'preferred · SSE', http: 'SSE', grpc: 'stream' };

/** Word of a finished check in the badge of its detail. */
export const RESULT_WORD: Record<AgentCheckResult, string> = { pass: 'passed', fail: 'failed', warn: 'absent' };

/** Segment of the progress bar for each cell state. */
export const SEGMENT: Record<CellResult, ProgressSegment> = { pass: 'done', fail: 'failed', warn: 'warn', running: 'current', queued: 'queued' };

/** "42 ms", or "1.27 s" from one second on. */
export const fmtMs = (ms: number): string => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms} ms`);

/** Word read after a toned fact value of the summary detail: empty when the tone tells nothing. */
export const TONE_WORD: Record<DetailTone, string> = { ok: 'ok', bad: 'problem', warn: 'warning', muted: '', plain: '' };

/** Tone of a fact value of the summary detail. */
export const FACT_TONE: Record<DetailTone, DetailFactTone | undefined> = { ok: 'success', bad: 'danger', warn: 'warning', muted: 'muted', plain: undefined };

/** The proposed command of the "Run it from CI" panel. */
export const CLI = "microcks test 'Pastry concierge:1.0' https://concierge.staging.acme.io A2A_CONFORMANCE --microcksURL=http://microcks.local:8080/api/ --waitFor=30sec";

/** The two ways to compare agent text loosely, each with an example. */
export const TEXT_MODES: readonly { value: AgentTestSetup['textMode']; label: string; example: string }[] = [
  { value: 'contains', label: 'Contains', example: '"Millefeuille" in the answer' },
  { value: 'regex', label: 'Regex', example: '/mille-?feuille/i' },
];

/** The list with the id added, or removed when it is already there. */
export const toggle = <T extends string>(list: readonly T[], id: T): T[] => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Whether the Agent Card URL is an http(s) URL. */
export const isCardUrl = (url: string) => /^https?:\/\/\S+$/.test(url.trim());

/** Whether the timeout field holds a number of milliseconds greater than 0 (`ms` is its parsed value). */
export const isTimeoutOk = (text: string, ms: number) => text.trim() !== '' && Number.isFinite(ms) && ms > 0;

/** "skill recommend-pastry · 1 turn · expects completed", by conversation id. */
export const conversationSubsOf = (conversations: readonly AgentTestConversation[]): Record<string, string> =>
  Object.fromEntries(conversations.map((c) => [c.id, `skill ${c.skillId} · ${c.turns} · expects ${c.expect}`]));

/** Number of the run in the title: the next run's on a fresh setup, else the shown run's. */
export const shownRunId = (phase: 'setup' | 'running' | 'done', current: Pick<AgentTestRun, 'id'> | undefined, nextRunId: string | undefined) =>
  phase === 'setup' && !current ? (nextRunId ?? '') : (current?.id ?? '');

/** Items of the run header: endpoint and runner, then start and duration once a run shows (`run`), then who launched it. */
export function runMetaItems({ cardUrl, run, running, elapsed, launchedBy, relative }: {
  cardUrl: string;
  run: Pick<AgentTestRun, 'startedAt'> | undefined;
  running: boolean;
  elapsed: number;
  launchedBy: string | undefined;
  relative: (date: string) => string;
}): RunMetaEntry[] {
  return [
    { term: 'Endpoint', value: cardUrl, kind: 'url' },
    { term: 'Runner', value: 'A2A_CONFORMANCE', kind: 'chip' },
    ...(run
      ? [
          { term: 'Started', value: relative(run.startedAt), detail: formatClock(run.startedAt) },
          { term: running ? 'Elapsed' : 'Duration', id: 'duration', value: fmtMs(elapsed), kind: 'mono' as const },
        ]
      : []),
    { term: 'Launched by', value: launchedBy ?? 'MA' },
  ];
}

/** State of check `i` once `tick` checks are revealed: its result, `running` for the next one while running, else `queued`. */
export function resultAt(checks: readonly AgentCheck[], tick: number, running: boolean, i: number): CellResult {
  const c = checks[i];
  if (!c) return 'queued';
  if (i < tick) return c.result;
  return running && i === tick ? 'running' : 'queued';
}

/** Status of the badge of a finished check. */
export const resultStatus = (result: AgentCheckResult) => (result === 'pass' ? 'success' : result === 'fail' ? 'danger' : 'warning');

const checkIndex = (checks: readonly AgentCheck[], row: string, transport: string) => checks.findIndex((c) => c.row === row && c.transport === transport);

/** One matrix column per tested transport. */
export const matrixColumns = (transports: readonly TransportId[]): RunMatrixColumn[] =>
  transports.map((t) => ({ id: t, label: AGENT_TRANSPORT_NAMES[t], sub: TRANSPORT_SUB[t] }));

/** The matrix rows once `shown` checks are revealed: the Agent Card checks, then the conversations. */
export function matrixGroups(run: AgentTestRun, shown: number, running: boolean, conversationSubs: Record<string, string>): RunMatrixGroup[] {
  const { transports, conversations } = run.setup;
  const cellsFor = (row: string, perTransport: boolean): RunMatrixCell[] => {
    const cell = (transport: string) => {
      const i = checkIndex(run.checks, row, transport);
      const result = resultAt(run.checks, shown, running, i);
      const done = result === 'pass' || result === 'fail' || result === 'warn';
      return { columnId: transport === '*' ? undefined : transport, result, label: result === 'warn' ? 'Absent' : undefined, duration: done ? fmtMs(run.checks[i]?.ms ?? 0) : undefined };
    };
    return perTransport ? transports.map((t) => cell(t)) : [cell('*')];
  };
  return [
    { id: 'card', label: 'Agent Card', sub: '/.well-known/agent-card.json · checked once, then per interface', rows: CARD_ROWS.map((r) => ({ id: r.id, label: r.label, sub: r.sub, cells: cellsFor(r.id, r.perTransport) })) },
    {
      id: 'conversations', label: 'Behaviour · conversations', sub: `${conversations.length} replayed · task states, artifacts, streaming, loose text match`,
      rows: conversations.map((c) => ({ id: c, label: c, sub: conversationSubs[c], mono: true, cells: cellsFor(c, true) })),
    },
  ];
}

/** The "Conversations passed" row once `shown` checks are revealed: passed over the conversations of each transport. */
export function matrixFooter(run: AgentTestRun, shown: number): RunMatrixFooter {
  const { transports, conversations } = run.setup;
  return {
    label: 'Conversations passed',
    cells: transports.map((t) => {
      const fin = conversations.filter((c) => checkIndex(run.checks, c, t) < shown);
      const ok = fin.filter((c) => run.checks[checkIndex(run.checks, c, t)]?.result === 'pass').length;
      return { text: fin.length ? `${ok}/${conversations.length}` : `—/${conversations.length}`, tone: fin.length && ok < fin.length ? ('danger' as const) : fin.length === conversations.length ? ('success' as const) : undefined };
    }),
  };
}

/** State of every check once `shown` checks are revealed. */
export const cellStates = (checks: readonly AgentCheck[], shown: number, running: boolean): CellResult[] => checks.map((_c, i) => resultAt(checks, shown, running, i));

/** Counts under the progress bar: passed, failed, warning, then queued with the running check. */
export function progressCounts(states: readonly CellResult[]): { kind: 'pass' | 'fail' | 'warn' | 'pending'; text: string }[] {
  const count = (r: CellResult) => states.filter((s) => s === r).length;
  return [
    { kind: 'pass', text: `${count('pass')} passed` },
    { kind: 'fail', text: `${count('fail')} failed` },
    { kind: 'warn', text: `${count('warn')} warning` },
    { kind: 'pending', text: `${count('queued') + count('running')} queued` },
  ];
}

/** Agent Card rows whose checks all passed. */
export const cardPassedCount = (checks: readonly AgentCheck[]) =>
  CARD_ROWS.map((r) => checks.filter((c) => c.row === r.id)).filter((cs) => cs.length > 0 && cs.every((c) => c.result === 'pass')).length;

/** Level of the score: `high` without a failed conversation, `mid` from 80 % passed, else `low`. */
export function scoreLevelOf(all: Pick<AgentTestTotals, 'conversationPassed' | 'conversationTotal' | 'conversationFailed'>): 'high' | 'mid' | 'low' {
  const ratio = all.conversationPassed / Math.max(1, all.conversationTotal);
  return all.conversationFailed === 0 ? 'high' : ratio >= 0.8 ? 'mid' : 'low';
}

/** Cell selected until one is chosen: the first failure once the run is done, else the last revealed check. */
export const autoSelectedKey = (running: boolean, firstFail: { row: string; transport: string } | undefined, last: { row: string; transport: string } | undefined) =>
  !running && firstFail ? cellKey(firstFail.row, firstFail.transport) : last ? cellKey(last.row, last.transport) : '';

/** Score of each transport: the result of each conversation (a missing check counts as passed) and how many passed. */
export function transportScores(run: AgentTestRun): { transport: TransportId; results: AgentCheckResult[]; ok: number }[] {
  const { transports, conversations } = run.setup;
  return transports.map((t) => {
    const results = conversations.map((c) => run.checks[checkIndex(run.checks, c, t)]?.result ?? 'pass');
    return { transport: t, results, ok: results.filter((r) => r === 'pass').length };
  });
}
