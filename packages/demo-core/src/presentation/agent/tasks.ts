import { isTerminalTaskState, type AgentTask, type TaskMessage } from '../../domain/agents/index.js';

/** Task selected when the tab opens. */
export const INITIAL_TASK_ID = 'task-9a04';

/** Note under CancelTask: why a terminal task cannot be canceled, else what canceling does. */
export const cancelNote = (task: Pick<AgentTask, 'id' | 'state'>) =>
  isTerminalTaskState(task.state) ? `TaskNotCancelableError: ${task.id} is ${task.state}.` : 'Moves the task to canceled and notifies its webhook.';

/** Caption of the GetTask response: call, transport, request and status. */
export const getTaskCaption = (task: Pick<AgentTask, 'id' | 'transport'>) => `GetTask · ${task.transport} · {"id":"${task.id}","historyLength":10} · 200 OK`;

/** Who wrote a history message: a system message is a status change. */
export const historyRole = (role: TaskMessage['role']) => (role === 'system' ? 'status change' : role);

/** Why a task has no artifact yet, or never will. */
export function noArtifactText(task: Pick<AgentTask, 'state'>): string {
  if (task.state === 'input-required') return 'None yet: the task waits for the size before it produces the order.';
  return !isTerminalTaskState(task.state) ? 'None yet: the first chunk arrives with the script timing.' : 'This task ended without an artifact.';
}
