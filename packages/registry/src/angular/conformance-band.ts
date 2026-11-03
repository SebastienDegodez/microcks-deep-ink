import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type OperationResult = 'pass' | 'fail' | 'untested';

/** "11 of 12 operations pass, 1 fails" */
export function conformanceLabel(outcomes: OperationResult[], unit = 'operation'): string {
  const total = outcomes.length;
  if (total === 0) return `No ${unit}s`;
  const pass = outcomes.filter((o) => o === 'pass').length;
  const fail = outcomes.filter((o) => o === 'fail').length;
  const untested = total - pass - fail;
  const parts = [`${pass} of ${total} ${unit}${total === 1 ? '' : 's'} pass`];
  if (fail) parts.push(`${fail} ${fail === 1 ? 'fails' : 'fail'}`);
  if (untested) parts.push(`${untested} untested`);
  return parts.join(', ');
}

/** One segment per operation. `full` adds the visible score and counts; `mini` is the catalogue-row version. */
@Component({
  selector: 'mk-conformance-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  styles: [':host { display: contents; }'],
  template: `
    @if (size() === 'mini') {
      <ng-container [ngTemplateOutlet]="band" />
    } @else {
      <div class="conformance-wrap">
        <ng-container [ngTemplateOutlet]="band" />
        <p class="conformance-summary">
          <span class="conformance-score" [attr.data-level]="level()">{{ score() }}%</span>
          <span>{{ text() }}</span>
        </p>
      </div>
    }
    <ng-template #band>
      <div class="conformance" [attr.data-size]="size()" role="img" [attr.aria-label]="text()">
        @for (result of outcomes(); track $index) {
          <span [attr.data-result]="result"></span>
        }
      </div>
    </ng-template>
  `,
})
export class ConformanceBandComponent {
  /** One entry per operation. */
  readonly outcomes = input.required<OperationResult[]>();
  readonly size = input<'full' | 'mini'>('full');
  /** What a segment counts, singular: `operation` (default) or `skill` for an A2A agent. */
  readonly unit = input('operation');

  protected readonly text = computed(() => conformanceLabel(this.outcomes(), this.unit()));
  protected readonly score = computed(() => {
    const o = this.outcomes();
    return o.length ? Math.round((o.filter((r) => r === 'pass').length / o.length) * 100) : 0;
  });
  protected readonly level = computed(() => (this.score() >= 80 ? 'high' : this.score() >= 50 ? 'mid' : 'low'));
}
