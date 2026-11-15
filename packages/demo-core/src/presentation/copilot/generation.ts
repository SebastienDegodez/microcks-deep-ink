import type { ExampleGroup } from '../../domain/copilot/index.js';
import type { Example, Operation } from '../../domain/shared/index.js';
import { parseUrl } from '../../domain/shared/url.js';
import type { Item, MockTarget } from './proposal.js';

type AiTone = 'warning' | 'success';

/** The proposals of one operation: `review` once a generation has started. */
export interface OpState { phase: 'idle' | 'review'; items: Item[] }

/** Choices of the "Number of examples" radiogroup. */
export const COUNTS: readonly number[] = [1, 2, 3, 4, 5];

/** The Copilot takes a while: the skeleton rows stay this long, as in the prototype. */
export const GENERATION_MS = 1800;

/** Mock target of a service without a mock base URL. */
export const DEFAULT_TARGET: MockTarget = { host: 'microcks.local:8080', basePath: '' };

/** "1 example", "3 examples". */
export const exWord = (n: number) => `${n} ${n === 1 ? 'example' : 'examples'}`;

/** Host and base path of the mock base URL, or the default target when it is missing or invalid. */
export function mockTarget(mockBase: string | undefined): MockTarget {
  if (!mockBase) return DEFAULT_TARGET;
  try {
    const url = parseUrl(mockBase);
    return { host: url.host, basePath: url.pathname.replace(/\/$/, '') };
  } catch {
    return DEFAULT_TARGET;
  }
}

/** Contract examples by operation id (AI examples, pending or accepted, are not part of the contract). */
export async function contractCounts(listExamples: (s: string, o: string) => Promise<Example[]>, serviceId: string, ops: Operation[]) {
  const lists = await Promise.all(ops.map((o) => listExamples(serviceId, o.id)));
  return Object.fromEntries(ops.map((o, i) => [o.id, (lists[i] ?? []).filter((e) => !e.aiGenerated).length])) as Record<string, number>;
}

/** Proposals by review status, over every operation. */
export interface ProposalSums { accepted: number; rejected: number; pending: number }

/** Counts the accepted, rejected and pending proposals of every operation. */
export function proposalSums(byOp: Record<string, OpState>): ProposalSums {
  const all = Object.values(byOp).flatMap((s) => s.items);
  return {
    accepted: all.filter((i) => i.status === 'accepted').length,
    rejected: all.filter((i) => i.status === 'rejected').length,
    pending: all.filter((i) => i.status === 'pending').length,
  };
}

/** Ids of the operations that keep a proposal that is not rejected. */
export const opsWithProposals = (byOp: Record<string, OpState>) => Object.keys(byOp).filter((k) => (byOp[k]?.items ?? []).some((i) => i.status !== 'rejected'));

/** AI figure of an operation in the picker ("generating", "+2 pending", "+1 accepted" or empty) and its tone. */
export function opPickAi(items: readonly Item[] | undefined, generating: boolean): { label: string; tone: AiTone } {
  const its = items ?? [];
  const pe = its.filter((i) => i.status === 'pending').length;
  const ac = its.filter((i) => i.status === 'accepted').length;
  const label = generating ? 'generating' : pe ? `+${pe} pending` : ac ? `+${ac} accepted` : '';
  return { label, tone: ac && !pe && !generating ? 'success' : 'warning' };
}

/** AI figure of the samples badge: "+2 AI" when accepted, else "+3 AI pending", else none. */
export const aiBadgeText = (sum: ProposalSums) => (sum.accepted ? `+${sum.accepted} AI` : sum.pending ? `+${sum.pending} AI pending` : undefined);

/** Note under the summary while some proposals are accepted and others stay pending. */
export const pendingNoteText = (sum: ProposalSums) =>
  sum.accepted > 0 && sum.pending > 0 ? `${sum.pending} pending ${sum.pending === 1 ? 'proposal stays' : 'proposals stay'} here and are not added.` : undefined;

/** APIExamples groups of the accepted proposals: one per operation that has some, in the operations order. */
export const exportGroups = (operations: readonly Operation[], byOp: Record<string, OpState>): ExampleGroup[] =>
  operations
    .map((o) => ({ operationKey: `${o.method} ${o.path}`, examples: (byOp[o.id]?.items ?? []).filter((i) => i.status === 'accepted').map((i) => i.example) }))
    .filter((g) => g.examples.length > 0);

/** File name of the export: `api-pastry-2.0-examples.yaml`. */
export const exportFileName = (svc: { name: string; version: string }) => `${svc.name.toLowerCase().replace(/\s+/g, '-')}-${svc.version}-examples.yaml`;
