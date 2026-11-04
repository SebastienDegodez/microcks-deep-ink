import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type RunnerLevel = 'INFO' | 'SEND' | 'PASS' | 'FAIL' | 'WARN' | 'WAIT';
export interface RunnerLine {
  time: string;
  level: RunnerLevel;
  text: string;
  /** Written in the main text colour. */
  emphasis?: boolean;
  /** Written in the danger colour. */
  error?: boolean;
}

let nextId = 0;

/**
 * The runner's log: a `role="log"` list (newest at the bottom, kept in view) under a small heading.
 * Project the status for the end of the header with `[mkRunnerLogStatus]`.
 */
@Component({
  selector: 'section[mkRunnerLog]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'runner-log',
    '[attr.aria-labelledby]': 'id',
    // `title` is an input here: do not leave it on the element as a tooltip.
    '[attr.title]': 'null',
  },
  template: `
    <div class="runner-log-head">
      <h2 class="runner-log-title" [id]="id">{{ title() }}</h2>
      <span class="runner-log-status"><ng-content select="[mkRunnerLogStatus]" /></span>
    </div>
    <div class="runner-log-body" role="log" [attr.aria-labelledby]="id" tabindex="0">
      <ol class="runner-log-lines">
        @for (l of lines(); track $index) {
          <li class="runner-log-line" [attr.data-level]="l.level" [attr.data-emphasis]="l.emphasis ? '' : null" [attr.data-error]="l.error ? '' : null"><span class="runner-log-time">{{ l.time }}</span><span class="runner-log-level">{{ l.level }}</span><span class="runner-log-text">{{ l.text }}</span></li>
        }
      </ol>
    </div>
  `,
})
export class RunnerLogComponent {
  /** Visible heading, also the name of the log. */
  readonly title = input('Runner log');
  readonly lines = input.required<RunnerLine[]>();
  protected readonly id = `mk-runner-log-${++nextId}`;
}
