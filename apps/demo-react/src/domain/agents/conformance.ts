import type { TransportId } from './types';

/** Rows of the agent test matrix: four Agent Card checks, then one row per conversation. */
export type AgentCheckRow = 'schema' | 'iface' | 'caps' | 'sig' | (string & {});
export type AgentCheckResult = 'pass' | 'fail' | 'warn';

export interface AgentTestConversation {
  id: string;
  skillId: string;
  turns: string;
  /** Terminal state the conversation expects. */
  expect: 'completed' | 'failed' | 'rejected';
  prompt: string;
  lifecycle: string;
  contains: string;
  regex: string;
  artifact: string;
  /** Duration per transport, in ms. */
  ms: Record<TransportId, number>;
}

export interface AgentTestSetup {
  serviceId: string;
  cardUrl: string;
  transports: TransportId[];
  conversations: string[];
  /** Secret name, or empty for none. */
  secret: string;
  timeoutMs: number;
  textMode: 'contains' | 'regex';
  dataSchema: boolean;
}

export interface AgentTestDefaults {
  setup: AgentTestSetup;
  transports: { id: TransportId; label: string; sub: string; url: string; preferred: boolean }[];
  conversations: AgentTestConversation[];
  secrets: { name: string; help: string; matches: boolean }[];
}

/** One executed check: a cell of the matrix. `transport` is `*` for a check made once. */
export interface AgentCheck {
  row: AgentCheckRow;
  transport: TransportId | '*';
  result: AgentCheckResult;
  ms: number;
}

export interface AgentTestRun {
  id: string;
  setup: AgentTestSetup;
  /** In execution order. */
  checks: AgentCheck[];
}

/** A check is queued/run in this order: card checks first, then conversation × transport. */
export function planChecks(setup: AgentTestSetup): { row: AgentCheckRow; transport: TransportId | '*' }[] {
  const plan: { row: AgentCheckRow; transport: TransportId | '*' }[] = [{ row: 'schema', transport: '*' }];
  for (const t of setup.transports) plan.push({ row: 'iface', transport: t });
  for (const t of setup.transports) plan.push({ row: 'caps', transport: t });
  plan.push({ row: 'sig', transport: '*' });
  for (const c of setup.conversations) for (const t of setup.transports) plan.push({ row: c, transport: t });
  return plan;
}

export function validateSetup(setup: AgentTestSetup): string | undefined {
  if (!/^https?:\/\/\S+$/.test(setup.cardUrl.trim())) return 'Enter the URL of the Agent Card to test.';
  if (setup.transports.length === 0) return 'Select at least one transport.';
  if (setup.conversations.length === 0) return 'Select at least one conversation.';
  if (!Number.isFinite(setup.timeoutMs) || setup.timeoutMs <= 0) return 'Enter a timeout in milliseconds, greater than 0.';
  return undefined;
}

/** "3 × 5 = 15 conversation checks, plus 4 Agent Card checks." */
export function setupSummary(setup: AgentTestSetup): string {
  const n = setup.transports.length * setup.conversations.length;
  return `${setup.transports.length} × ${setup.conversations.length} = ${n} conversation checks, plus 4 Agent Card checks.`;
}

export interface AgentTestTotals {
  conversationPassed: number;
  conversationTotal: number;
  conversationFailed: number;
  pass: number;
  fail: number;
  warn: number;
}

export function totalsOf(checks: readonly AgentCheck[]): AgentTestTotals {
  const conv = checks.filter((c) => !['schema', 'iface', 'caps', 'sig'].includes(c.row));
  return {
    conversationPassed: conv.filter((c) => c.result === 'pass').length,
    conversationTotal: conv.length,
    conversationFailed: conv.filter((c) => c.result === 'fail').length,
    pass: checks.filter((c) => c.result === 'pass').length,
    fail: checks.filter((c) => c.result === 'fail').length,
    warn: checks.filter((c) => c.result === 'warn').length,
  };
}

/** Passed conversations over conversations, for one transport. */
export function transportScore(checks: readonly AgentCheck[], transport: TransportId): { passed: number; total: number } {
  const conv = checks.filter((c) => c.transport === transport && !['schema', 'iface', 'caps', 'sig'].includes(c.row));
  return { passed: conv.filter((c) => c.result === 'pass').length, total: conv.length };
}

export function agentRunPassed(checks: readonly AgentCheck[]): boolean {
  return checks.every((c) => c.result !== 'fail');
}

export function cellKey(row: string, transport: string): string {
  return `${row}|${transport}`;
}

export type DetailTone = 'ok' | 'bad' | 'warn' | 'muted' | 'plain';

export interface DetailRow {
  label: string;
  value: string;
  tone: DetailTone;
}

export interface LaneNodeData {
  label: string;
  task?: string;
  at?: string;
  tone?: 'ok' | 'bad';
  absent?: boolean;
}

export interface ExchangeLine {
  text: string;
  /** `bad` and `ok` highlight a line of the diff; `head` is a header line. */
  kind?: 'head' | 'ok' | 'bad';
}

export interface Exchange {
  head: string;
  status: string;
  statusTone: DetailTone;
  highlight: boolean;
  request: ExchangeLine[];
  response: ExchangeLine[];
}

export interface StreamEventData {
  at: string;
  kind: string;
  detail: string;
  flags: { text: string; tone: DetailTone }[];
  /** `x` marks a faulty event, `+` an event the contract expects and the agent did not send. */
  mark?: 'x' | '+';
  expected?: boolean;
}

/** What the detail pane shows for a cell of the matrix. */
export type AgentCheckDetail =
  | { kind: 'summary'; title: string; sub: string; rows: DetailRow[]; note: string }
  | { kind: 'lanes'; title: string; sub: string; lanes: { label: string; sub: string; tone: 'ok' | 'bad'; nodes: LaneNodeData[] }[]; exchanges: Exchange[] }
  | { kind: 'stream'; title: string; sub: string; events: StreamEventData[] };

export interface AgentTestRunWithDetails extends AgentTestRun {
  /** Detail of each finished cell, by `cellKey(row, transport)`. */
  details: Record<string, AgentCheckDetail>;
  /** Failures with a one-line cause, to jump to them from the summary. */
  failures: { row: string; transport: TransportId; cause: string }[];
}
