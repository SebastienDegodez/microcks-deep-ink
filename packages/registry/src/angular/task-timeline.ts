import { booleanAttribute, ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from './icon';

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

/** Glyph + state name. The word is always written; the color only speeds up scanning. */
@Component({
  selector: 'span[mkTaskStateTag]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'task-state', '[attr.data-state]': 'state()', '[attr.data-ghost]': "ghost() ? '' : null" },
  template: `<svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">@for (d of paths(state()); track d) {<path [attr.d]="d" />}</svg>{{ state() }}`,
})
export class TaskStateTagComponent {
  readonly state = input.required<TaskState>();
  /** Dashed outline: a state the task did not reach. */
  readonly ghost = input(false, { transform: booleanAttribute });

  protected paths(state: TaskState): string[] {
    return STATE_PATHS[state];
  }
}

export interface TaskTimelineNode {
  state: TaskState;
  /** When the task entered the state: "+300 ms", "turn 2". */
  at: string;
  /** Text on the link from the previous node: `reply “M”` when a user message resumed the task. */
  connector?: string;
}

/**
 * The lifecycle of an A2A task as a chain of states. Nodes are static, or buttons (`selectable`) that select
 * a step of a script. A connector that carries text (a user reply that resumed the task) is written, not drawn.
 */
@Component({
  selector: 'ol[mkTaskTimeline]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TaskStateTagComponent],
  host: { class: 'task-timeline', '[attr.aria-label]': 'label()' },
  template: `
    @for (node of nodes(); track $index) {
      <li class="task-timeline-node" [attr.data-selected]="selectedIndex() === $index ? '' : null">
        @if ($index > 0) {
          <span class="task-timeline-link" [attr.data-text]="node.connector ? '' : null">{{ node.connector }}</span>
        }
        @if (selectable()) {
          <button
            type="button"
            class="task-state"
            [attr.data-state]="node.state"
            [attr.aria-pressed]="selectedIndex() === $index"
            [attr.aria-label]="node.state + ' at ' + node.at + ', show in script'"
            (click)="nodeSelect.emit(selectedIndex() === $index ? undefined : $index)"
          >
            <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">@for (d of paths(node.state); track d) {<path [attr.d]="d" />}</svg>{{ node.state }}
          </button>
        } @else {
          <span mkTaskStateTag [state]="node.state"></span>
        }
        <span class="task-timeline-at">{{ node.at }}</span>
      </li>
    }
    @if (showUnreached() && unreached().length) {
      <li class="task-timeline-unreached">
        <span>other end states</span>
        @for (s of unreached(); track s) {
          <span mkTaskStateTag [state]="s" ghost></span>
        }
      </li>
    }
  `,
})
export class TaskTimelineComponent {
  /** Accessible name of the list. */
  readonly label = input('Task lifecycle');
  readonly nodes = input.required<TaskTimelineNode[]>();
  /** Index of the highlighted node. */
  readonly selectedIndex = input<number>();
  /** Makes the nodes buttons (`aria-pressed`); `nodeSelect` emits `undefined` when the selected node is pressed again. */
  readonly selectable = input(false, { transform: booleanAttribute });
  /** Lists the terminal states the task did not reach, as dashed tags. */
  readonly showUnreached = input(true, { transform: booleanAttribute });
  readonly nodeSelect = output<number | undefined>();

  protected readonly unreached = computed(() => {
    const reached = this.nodes()[this.nodes().length - 1]?.state;
    return TASK_TERMINAL.filter((s) => s !== reached);
  });
  protected paths(state: TaskState): string[] {
    return STATE_PATHS[state];
  }
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

/**
 * State-machine diff: lanes of nodes laid side by side ("Expected" and "Actual"). An illegal node carries an
 * icon and a hidden word, so the difference does not rest on the red outline.
 */
@Component({
  selector: 'div[mkTaskLanes]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'task-lanes', role: 'region', 'aria-label': 'Task lanes', tabindex: '0' },
  template: `
    @for (lane of lanes(); track lane.label) {
      <div class="task-lane" [attr.data-tone]="lane.tone ?? null">
        <p class="task-lane-title">
          <strong>{{ lane.label }}</strong>
          @if (lane.sub) {
            <span>{{ lane.sub }}</span>
          }
        </p>
        <ol [attr.aria-label]="lane.sub ? lane.label + ': ' + lane.sub : lane.label">
          @for (node of lane.nodes; track $index) {
            <li class="task-lane-node" [attr.data-tone]="node.tone ?? null" [attr.data-absent]="node.absent ? '' : null">
              @if (node.absent) {
                <span aria-hidden="true">—</span>
              } @else {
                <span class="task-lane-label">
                  @if (node.tone === 'bad') {
                    <svg mkIcon name="cross" [size]="12"></svg>
                  } @else if (node.tone === 'ok') {
                    <svg mkIcon name="check" [size]="12"></svg>
                  }
                  {{ node.label }}
                  @if (node.tone) {
                    <span class="sr-only"> ({{ node.tone === 'bad' ? 'illegal' : 'legal' }})</span>
                  }
                </span>
                @if (node.task) {
                  <span class="task-lane-task">{{ node.task }}</span>
                }
                @if (node.at) {
                  <span class="task-lane-at">{{ node.at }}</span>
                }
              }
            </li>
          }
        </ol>
      </div>
    }
  `,
})
export class TaskLanesComponent {
  readonly lanes = input.required<TaskLane[]>();
}
