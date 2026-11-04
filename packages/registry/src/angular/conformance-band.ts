import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { IconComponent } from './icon';

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

/** One segment per operation. `full` (12px cells, optional labels and summary) or `mini` (catalogue rows). */
@Component({
  selector: 'mk-conformance-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, IconComponent],
  styles: [':host { display: contents; }'],
  template: `
    @if (size() !== 'mini' && showSummary()) {
      <div class="conformance-wrap">
        <ng-container [ngTemplateOutlet]="band" />
        <p class="conformance-summary">
          <span class="conformance-score" [attr.data-level]="level()">{{ score() }}%</span>
          <span>{{ text() }}</span>
        </p>
      </div>
    } @else {
      <ng-container [ngTemplateOutlet]="band" />
    }
    <ng-template #band>
      @if (size() !== 'mini' && labels(); as ls) {
        <ul class="conformance" [attr.data-size]="size()" data-labelled="" [attr.aria-label]="text()">
          @for (result of outcomes(); track $index) {
            <li [attr.data-result]="result">
              <span class="conformance-bar" aria-hidden="true"></span>
              <span class="conformance-label"><svg mkIcon [name]="iconFor(result)" [size]="12"></svg>{{ ls[$index] }}</span>
            </li>
          }
        </ul>
      } @else {
        <div class="conformance" [attr.data-size]="size()" role="img" [attr.aria-label]="text()">
          @for (result of outcomes(); track $index) {
            <span [attr.data-result]="result"></span>
          }
        </div>
      }
    </ng-template>
  `,
})
export class ConformanceBandComponent {
  /** One entry per operation. */
  readonly outcomes = input.required<OperationResult[]>();
  /** `full`: 12px cells; `mini`: the 96 x 14 catalogue-row band. */
  readonly size = input<'full' | 'mini'>('full');
  /** One visible label per cell, written under it ("GET /pastries · passed"). Full size only. */
  readonly labels = input<string[]>();
  /** Adds the 40px score and the counts as text under the band. Full size only. */
  readonly showSummary = input(false);
  /** What a segment counts, singular: `operation` (default) or `skill` for an A2A agent. */
  readonly unit = input('operation');

  protected readonly text = computed(() => conformanceLabel(this.outcomes(), this.unit()));
  protected readonly score = computed(() => {
    const o = this.outcomes();
    return o.length ? Math.round((o.filter((r) => r === 'pass').length / o.length) * 100) : 0;
  });
  protected iconFor(r: OperationResult) {
    return ({ pass: 'check', fail: 'cross', untested: 'circle' } as const)[r];
  }
  protected readonly level = computed(() => (this.score() >= 80 ? 'high' : this.score() >= 50 ? 'mid' : 'low'));
}
