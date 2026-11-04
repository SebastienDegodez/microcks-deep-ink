import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { IconComponent } from './icon';

export type RunSegment = 'done' | 'failed' | 'warn' | 'current' | 'queued';
export interface RunCount {
  kind: 'pass' | 'fail' | 'warn' | 'pending';
  /** "4 passed" */
  text: string;
}

const COUNT_ICON = { pass: 'check', fail: 'cross', warn: 'warning', pending: 'circle' } as const;

/**
 * Progress of a running test: the count done, what runs now, one segment per step, the counts by result.
 * Project a control for the end of the counts row with `[mkRunProgressAction]`.
 */
@Component({
  selector: 'section[mkRunProgress]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'run-progress', '[attr.aria-label]': 'label()', '[style.--run-gap]': "gap() !== undefined ? gap() + 'px' : null" },
  template: `
    <div class="run-progress-top">
      <p class="run-progress-count">
        <span class="run-progress-done">{{ done() }}<span class="run-progress-total">/{{ total() }}</span></span>
        <span class="run-progress-caption">{{ caption() }}</span>
      </p>
      @if (now() !== undefined) {
        <div class="run-progress-now" aria-live="polite">
          @if (nowLabel()) {<span class="run-progress-now-label">{{ nowLabel() }}</span>}
          <span class="run-progress-now-value">{{ now() }}</span>
        </div>
      }
    </div>
    <div class="run-progress-bar" role="img" [attr.aria-label]="summary()">
      @for (s of segments(); track $index) {<span [attr.data-seg]="s"></span>}
    </div>
    <div class="run-progress-foot">
      @if (counts().length) {
        <ul class="run-progress-counts">
          @for (c of counts(); track c.kind + c.text) {
            <li [attr.data-kind]="c.kind"><svg mkIcon [name]="iconFor(c.kind)" [size]="13"></svg>{{ c.text }}</li>
          }
        </ul>
      }
      <span class="run-progress-action"><ng-content select="[mkRunProgressAction]" /></span>
    </div>
    @if (note()) {<p class="run-progress-note">{{ note() }}</p>}
  `,
})
export class RunProgressComponent {
  readonly label = input('Progress');
  readonly done = input.required<number>();
  readonly total = input.required<number>();
  /** "test steps done", "matrix cells filled". */
  readonly caption = input.required<string>();
  /** "Now calling", "Now checking". */
  readonly nowLabel = input<string>();
  /** What runs now. Announced politely when it changes. */
  readonly now = input<string>();
  readonly segments = input.required<RunSegment[]>();
  readonly counts = input<RunCount[]>([]);
  readonly note = input<string>();
  /** Gap between segments in px (4 by default, 3 for dense matrices). */
  readonly gap = input<number>();

  protected readonly summary = computed(() => `${this.done()} of ${this.total()} ${this.caption()}`);
  protected iconFor(k: RunCount['kind']) {
    return COUNT_ICON[k];
  }
}
