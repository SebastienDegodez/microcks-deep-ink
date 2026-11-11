import { isTerminalTaskState, totalsOf, type AgentProfile, type AgentTask, type AgentTestRun } from '../../domain/agents/index.js';
import { ago } from '../shared/format.js';

/** Tabs of the agent screen. */
export type TabId = 'skills' | 'card' | 'mock' | 'tasks';

/** The tabs, in order. */
export const TAB_IDS: readonly TabId[] = ['skills', 'card', 'mock', 'tasks'];

/** Tab of the `:tab` route param: the skills when it is missing or unknown. */
export const tabOf = (tab: string | undefined): TabId => (TAB_IDS.includes(tab as TabId) ? (tab as TabId) : 'skills');

/** Tasks of the mock not in a terminal state yet. */
export const openTaskCount = (tasks: readonly AgentTask[] | undefined) => (tasks ?? []).filter((t) => !isTerminalTaskState(t.state)).length;

/** Label of the header's live indicator: "mock live · 2 open tasks · last message 12 s ago". */
export function mockLiveLabel(tasks: readonly AgentTask[] | undefined): string {
  const open = openTaskCount(tasks);
  const lastMessage = ago(Math.min(...(tasks ?? []).map((t) => t.updatedSecondsAgo), 999999));
  return `mock live · ${open} open ${open === 1 ? 'task' : 'tasks'} · last message ${lastMessage}`;
}

/** Value of the "last test" badge: passed over checked conversations once the run is loaded, else "#3 failed". */
export function runScore(agent: Pick<AgentProfile, 'lastTest'>, run: Pick<AgentTestRun, 'checks'> | undefined): string {
  if (!run) return `#${agent.lastTest.runId} ${agent.lastTest.result}`;
  const totals = totalsOf(run.checks);
  return `${totals.conversationPassed}/${totals.conversationTotal}`;
}

/** Title of the "last test" link: "Run #3 · A2A_CONFORMANCE · 3 transports", or "Run #3" before the run loads. */
export const runTitle = (agent: Pick<AgentProfile, 'lastTest'>, run: Pick<AgentTestRun, 'id' | 'setup'> | undefined) =>
  run ? `Run #${run.id} · A2A_CONFORMANCE · ${run.setup.transports.length} transports` : `Run #${agent.lastTest.runId}`;

/** Where the card was imported from, without its `http://` or `https://` scheme. */
export const importHost = (url: string) => url.replace(/^https?:\/\//, '');
