import type { ServiceDetails, SnippetSpec, WorkflowUsage } from '../../domain/catalog/index.js';
import type { Example, Operation } from '../../domain/shared/index.js';
import type { TestResult } from '../../domain/testing/index.js';
import { MONTHS, pluralize } from '../shared/format.js';

/** Tabs of the service screen. */
export type TabId = 'operations' | 'properties' | 'tests';
const TAB_IDS: readonly TabId[] = ['operations', 'properties', 'tests'];

/** Tab of the `:tab` route param: the operations when it is missing or unknown. */
export const tabOf = (tab: string | undefined): TabId => (TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'operations');

/** Number of test runs the Tests tab lists. */
export const RECENT_RUNS = 3;

/** "3 examples". */
export const examplesLabel = (n: number) => pluralize(n, 'example');

/** Parameters of an example as `key=value` joined with " · ", or "no parameter". */
export const exampleSub = (e: Example) => Object.entries(e.request.params).map(([k, v]) => `${k}=${v}`).join(' · ') || 'no parameter';

const DAY_MS = 86_400_000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Initial of each week day, Sunday first: the letters under the sparkline bars. */
export const DAY_LETTERS: readonly string[] = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Day of each sparkline value, the last one being `today`. */
export const sparkDays = (values: readonly number[], today: Date): Date[] => values.map((_, i) => new Date(today.getTime() - (values.length - 1 - i) * DAY_MS));

/** "Tue, Nov 3" (UTC), or an empty string without a day. */
export const longDay = (d: Date | undefined) => (!d ? '' : `${DAY_NAMES[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`);

/** CSS height of a sparkline bar: its share of the highest value, 6% at least. */
export const barHeight = (v: number, max: number) => `${Math.max(6, Math.round((v / max) * 100))}%`;

const TARGET_LABEL = { mocks: 'Microcks mocks', implementations: 'Implementations', mixed: 'Mocks and implementations' } as const;

type ResultIcon = 'minus-circle' | 'warning' | 'check-circle' | 'x-circle';

/** Icon, text and tone of the last run of a workflow that uses the service. */
export function workflowResult(usage: WorkflowUsage, relative: (d: string) => string): { icon: ResultIcon; text: string; tone: 'never' | 'blocked' | 'passed' | 'failed' } {
  const r = usage.result;
  if (r?.kind === 'blocked') return { icon: 'warning', text: r.reason, tone: 'blocked' };
  if (r?.kind === 'passed' || r?.kind === 'failed') {
    return {
      icon: r.kind === 'passed' ? 'check-circle' : 'x-circle',
      text: `${r.kind === 'passed' ? 'Passed' : 'Failed'} #${r.runNumber} · ${TARGET_LABEL[r.target]} · ${relative(r.at)}`,
      tone: r.kind,
    };
  }
  return { icon: 'minus-circle', text: 'Never run', tone: 'never' };
}

/**
 * Operation of the detail: the `op` query param, else, like the prototype, the "by name" operation (the one that
 * carries the AI proposal), else the first one.
 */
export const pickOperation = (ops: readonly Operation[] | undefined, id: string | null): Operation | undefined =>
  ops?.find((o) => o.id === id) ?? ops?.find((o) => o.id === 'get-name') ?? ops?.[0];

/**
 * Examples of an operation as the screen lists them: the accepted ones, then the pending AI proposals. The
 * selected one is `exampleId`, else the first accepted example.
 */
export function exampleView(list: readonly Example[], exampleId: string | null) {
  const pending = list.filter((e) => e.reviewState === 'pending');
  const accepted = list.filter((e) => e.reviewState !== 'pending');
  const fromContract = accepted.filter((e) => !e.aiGenerated);
  const aiAccepted = accepted.filter((e) => e.aiGenerated);
  const ordered = [...accepted, ...pending];
  const selected: Example | undefined = ordered.find((e) => e.id === exampleId) ?? accepted[0] ?? ordered[0];
  return { pending, fromContract, aiAccepted, ordered, selected };
}

/** Pending AI proposals over every operation, by operation id. */
export const pendingCount = (all: Readonly<Record<string, readonly Example[]>> | undefined) =>
  Object.values(all ?? {}).reduce((n, l) => n + l.filter((e) => e.reviewState === 'pending').length, 0);

/** Examples of an operation in the rail: "2 examples", plus " · +1 AI" for the pending proposals. */
export function examplesMeta(exs: readonly Example[]): string {
  const ai = exs.filter((e) => e.reviewState === 'pending').length;
  return `${examplesLabel(exs.length - ai)}${ai ? ` · +${ai} AI` : ''}`;
}

/** Call of an example of an operation, for the mock URL and the snippets: none without both. */
export const snippetSpec = (op: Operation | undefined, example: Example | undefined, details: Pick<ServiceDetails, 'mockBase' | 'mcp'>): SnippetSpec | undefined =>
  op && example ? { method: op.method, pathTemplate: op.path, example, mockBase: details.mockBase, mcpBase: details.mcp?.httpUrl ?? '', mcpTool: op.mcpTool } : undefined;

/** Workflow steps that call an operation: "<workflow> › <step>" and the step's operationId. */
export const stepRefsOf = (usages: readonly WorkflowUsage[], opId: string | undefined) =>
  usages.flatMap((u) => (u.steps ?? []).filter((s) => s.catalogOperationId === opId).map((s) => ({ ref: `${u.summary} › ${s.stepId}`, operationId: s.operationId })));

/** The AI proposal is built from the response schema, named after the API's resource ("API Pastry" → Pastry). */
export const schemaNameOf = (serviceName: string) => serviceName.split(' ').pop() ?? serviceName;

/** Tone of a test run in the run list: a timeout counts as failed. */
export const runTone = (result: TestResult): 'passed' | 'running' | 'failed' => (result === 'passed' ? 'passed' : result === 'running' ? 'running' : 'failed');
