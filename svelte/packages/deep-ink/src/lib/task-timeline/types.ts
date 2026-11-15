import type { HTMLAttributes } from 'svelte/elements';

export type TaskState = 'submitted' | 'working' | 'input-required' | 'auth-required' | 'completed' | 'failed' | 'rejected' | 'canceled';

export const TASK_STATES: readonly TaskState[] = ['submitted', 'working', 'input-required', 'auth-required', 'completed', 'failed', 'rejected', 'canceled'];
/** A task in a terminal state never moves again. */
export const TASK_TERMINAL: readonly TaskState[] = ['completed', 'failed', 'rejected', 'canceled'];

export function isTerminalState(state: TaskState): boolean {
  return TASK_TERMINAL.includes(state);
}


export interface TaskStateTagProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children'> {
  class?: string;
  state: TaskState;
  /** Dashed outline: a state the task did not reach. */
  ghost?: boolean;
}

export interface TaskTimelineNode {
  state: TaskState;
  /** When the task entered the state: "+300 ms", "turn 2". */
  at: string;
  /** Text on the link from the previous node: `reply “M”` when a user message resumed the task. */
  connector?: string;
}

export interface TaskTimelineProps extends Omit<HTMLAttributes<HTMLOListElement>, 'onselect' | 'class' | 'children'> {
  class?: string;
  /** Accessible name of the list. */
  label?: string;
  nodes: TaskTimelineNode[];
  /** Index of the highlighted node. */
  selectedIndex?: number;
  /** Makes the nodes buttons (`aria-pressed`). Called with `undefined` when the selected node is pressed again. */
  onselectnode?: (index: number | undefined) => void;
  /** Lists the terminal states the task did not reach, as dashed tags. */
  showUnreached?: boolean;
}

export interface TaskLaneNode {
  /** State or action: "input-required", `user "M"`. */
  label: string;
  /** `task t-1 · resumed` */
  task?: string;
  at?: string;
  /** `ok` marks a legal transition worth noticing, `bad` an illegal one. */
  tone?: 'ok' | 'bad';
  /** Dashed placeholder: nothing happened here. */
  absent?: boolean;
}

export interface TaskLane {
  label: string;
  sub?: string;
  /** Color of the lane title. */
  tone?: 'ok' | 'bad';
  nodes: TaskLaneNode[];
}

export interface TaskLanesProps extends Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'children'> {
  class?: string;
  lanes: TaskLane[];
}
