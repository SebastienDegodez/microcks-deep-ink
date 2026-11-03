// Deep Ink · task-timeline@0.2.0 · copied from packages/registry. You own this file.
import type { HTMLAttributes } from 'react';
import { Icon } from './icon';

/** Task states of the A2A task lifecycle. */
export type TaskState = 'submitted' | 'working' | 'input-required' | 'auth-required' | 'completed' | 'failed' | 'rejected' | 'canceled';

export const TASK_STATES: readonly TaskState[] = ['submitted', 'working', 'input-required', 'auth-required', 'completed', 'failed', 'rejected', 'canceled'];
/** A task in a terminal state never moves again. */
export const TASK_TERMINAL: readonly TaskState[] = ['completed', 'failed', 'rejected', 'canceled'];

export function isTerminalState(state: TaskState): boolean {
  return TASK_TERMINAL.includes(state);
}

const CIRCLE = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0';
/** One glyph per state, so the shape (not only the color) tells states apart. */
const STATE_PATHS: Record<TaskState, string[]> = {
  submitted: [CIRCLE, 'M12 7.5V12l3 2'],
  working: ['M20 12a8 8 0 1 1-2.34-5.66', 'M20 4v4h-4'],
  'input-required': ['M4 5h16v11H9l-5 4z', 'M10 9.2a2 2 0 1 1 2.8 1.8c-.5.3-.8.7-.8 1.3', 'M12 14h.01'],
  'auth-required': ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  completed: [CIRCLE, 'M8 12.5l2.5 2.5L16 9.5'],
  failed: [CIRCLE, 'M9 9l6 6M15 9l-6 6'],
  rejected: [CIRCLE, 'M5.6 5.6l12.8 12.8'],
  canceled: [CIRCLE, 'M9.5 9.5h5v5h-5z'],
};

function StateGlyph({ state, size = 14 }: { state: TaskState; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {STATE_PATHS[state].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export interface TaskStateTagProps extends HTMLAttributes<HTMLSpanElement> {
  state: TaskState;
  /** Dashed outline: a state the task did not reach. */
  ghost?: boolean;
}

/** Glyph + state name. The word is always written; the color only speeds up scanning. */
export function TaskStateTag({ state, ghost, className, ...rest }: TaskStateTagProps) {
  return (
    <span {...rest} className={['task-state', className].filter(Boolean).join(' ')} data-state={state} data-ghost={ghost ? '' : undefined}>
      <StateGlyph state={state} />
      {state}
    </span>
  );
}

export interface TaskTimelineNode {
  state: TaskState;
  /** When the task entered the state: "+300 ms", "turn 2". */
  at: string;
  /** Text on the link from the previous node: `reply “M”` when a user message resumed the task. */
  connector?: string;
}

export interface TaskTimelineProps extends Omit<HTMLAttributes<HTMLOListElement>, 'onSelect'> {
  /** Accessible name of the list. */
  label?: string;
  nodes: TaskTimelineNode[];
  /** Index of the highlighted node. */
  selectedIndex?: number;
  /** Makes the nodes buttons (`aria-pressed`). Called with `undefined` when the selected node is pressed again. */
  onSelectNode?: (index: number | undefined) => void;
  /** Lists the terminal states the task did not reach, as dashed tags. */
  showUnreached?: boolean;
}

/**
 * The lifecycle of an A2A task as a chain of states. Nodes are static, or buttons that select a step of
 * a script. A connector that carries text (a user reply that resumed the task) is written, not drawn.
 */
export function TaskTimeline({ label = 'Task lifecycle', nodes, selectedIndex, onSelectNode, showUnreached = true, className, ...rest }: TaskTimelineProps) {
  const reached = nodes[nodes.length - 1]?.state;
  const unreached = TASK_TERMINAL.filter((s) => s !== reached);
  return (
    <ol {...rest} aria-label={label} className={['task-timeline', className].filter(Boolean).join(' ')}>
      {nodes.map((node, i) => {
        const on = selectedIndex === i;
        return (
          <li key={`${node.state}-${i}`} className="task-timeline-node" data-selected={on ? '' : undefined}>
            {i > 0 ? <span className="task-timeline-link" data-text={node.connector ? '' : undefined}>{node.connector}</span> : null}
            {onSelectNode ? (
              <button
                type="button"
                className="task-state"
                data-state={node.state}
                aria-pressed={on}
                aria-label={`${node.state} at ${node.at}, show in script`}
                onClick={() => onSelectNode(on ? undefined : i)}
              >
                <StateGlyph state={node.state} />
                {node.state}
              </button>
            ) : (
              <TaskStateTag state={node.state} />
            )}
            <span className="task-timeline-at">{node.at}</span>
          </li>
        );
      })}
      {showUnreached && unreached.length ? (
        <li className="task-timeline-unreached">
          <span>other end states</span>
          {unreached.map((s) => (
            <TaskStateTag key={s} state={s} ghost />
          ))}
        </li>
      ) : null}
    </ol>
  );
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

export interface TaskLanesProps extends HTMLAttributes<HTMLDivElement> {
  lanes: TaskLane[];
}

/**
 * State-machine diff: lanes of nodes laid side by side ("Expected" and "Actual"). An illegal node carries an
 * icon and a hidden word, so the difference does not rest on the red outline.
 */
export function TaskLanes({ lanes, className, ...rest }: TaskLanesProps) {
  return (
    <div role="region" aria-label="Task lanes" tabIndex={0} {...rest} className={['task-lanes', className].filter(Boolean).join(' ')}>
      {lanes.map((lane) => (
        <div key={lane.label} className="task-lane" data-tone={lane.tone}>
          <p className="task-lane-title">
            <strong>{lane.label}</strong>
            {lane.sub ? <span>{lane.sub}</span> : null}
          </p>
          <ol aria-label={lane.sub ? `${lane.label}: ${lane.sub}` : lane.label}>
            {lane.nodes.map((node, i) => (
              <li key={i} className="task-lane-node" data-tone={node.tone} data-absent={node.absent ? '' : undefined}>
                {node.absent ? (
                  <span aria-hidden="true">—</span>
                ) : (
                  <>
                    <span className="task-lane-label">
                      {node.tone === 'bad' ? <Icon name="cross" size={12} /> : node.tone === 'ok' ? <Icon name="check" size={12} /> : null}
                      {node.label}
                      {node.tone ? <span className="sr-only"> ({node.tone === 'bad' ? 'illegal' : 'legal'})</span> : null}
                    </span>
                    {node.task ? <span className="task-lane-task">{node.task}</span> : null}
                    {node.at ? <span className="task-lane-at">{node.at}</span> : null}
                  </>
                )}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
