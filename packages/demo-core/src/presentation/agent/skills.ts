import type { AgentProfile, AgentTaskState, Conversation } from '../../domain/agents/index.js';

/** Id of the last entry of the skill list: the messages no skill matched. */
export const FALLBACK_ID = '__fallback';

/** Icons of the terminal states. */
export type EndIconName = 'check-circle' | 'x-circle' | 'ban' | 'stop-circle';

/** Glyph of a terminal state, written next to the state word (conversation cards). */
export const END_ICON: Partial<Record<AgentTaskState, EndIconName>> = { completed: 'check-circle', failed: 'x-circle', rejected: 'ban', canceled: 'stop-circle' };

/** One entry of the skill list, shaped like the design system's `SkillItem`. */
export interface SkillEntry {
  id: string;
  name: string;
  calls?: number;
  tags?: string[];
  meta?: string;
  result?: 'pass' | 'fail';
  resultNote?: string;
  fallback?: boolean;
}

/** Entries of the skill list: each skill of the card with its conversation count, then the fallback. */
export function skillItems(agent: Pick<AgentProfile, 'skills' | 'fallbackCalls'>): SkillEntry[] {
  return [
    ...agent.skills.map((s) => ({
      id: s.id, name: s.name, calls: s.calls, tags: s.tags, result: s.lastTest.result, resultNote: s.lastTest.title,
      meta: `${s.conversationIds.length} ${s.conversationIds.length === 1 ? 'conversation' : 'conversations'}`,
    })),
    { id: FALLBACK_ID, name: 'No skill matched', fallback: true, calls: agent.fallbackCalls, meta: 'fallback · out-of-scope · answers rejected' },
  ];
}

/** Skill selected when the tab opens: the second one, else the first, else the fallback. */
export const initialSkillId = (agent: Pick<AgentProfile, 'skills'>) => agent.skills[1]?.id ?? agent.skills[0]?.id ?? FALLBACK_ID;

/** One node of a lifecycle timeline, shaped like the design system's `TaskTimelineNode`. */
export interface TimelineNode {
  state: AgentTaskState;
  at: string;
  connector?: string | undefined;
}

/** Index in the script of each `state` step: the nodes of its lifecycle timeline. */
export const stateIndices = (conversation: Pick<Conversation, 'steps'>): number[] => conversation.steps.flatMap((s, i) => (s.kind === 'state' ? [i] : []));

/** Lifecycle of a script: one node per `state` step, linked by the text of the user reply that resumed the task. */
export function timelineNodes(conversation: Pick<Conversation, 'steps'>): TimelineNode[] {
  const stateIdx = stateIndices(conversation);
  return stateIdx.map((ri, j) => {
    const step = conversation.steps[ri];
    const between = j > 0 ? conversation.steps.slice((stateIdx[j - 1] ?? 0) + 1, ri) : [];
    const reply = between.find((b) => b.kind === 'user');
    const first = reply && reply.kind === 'user' ? reply.parts[0] : undefined;
    return {
      state: step?.kind === 'state' ? step.state : 'submitted',
      at: step?.at ?? '',
      connector: first && first.kind === 'text' ? `reply “${first.text}”` : undefined,
    };
  });
}
