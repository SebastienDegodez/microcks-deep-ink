import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon';
import type { IconName } from './icon';

export type StepOutcome = 'passed' | 'failed' | 'not-run';
export type CheckState = 'passed' | 'failed' | 'off' | 'not-evaluated';

const STEP: Record<StepOutcome, { icon: IconName; word: string }> = {
  passed: { icon: 'check', word: 'Passed' },
  failed: { icon: 'cross', word: 'Failed' },
  'not-run': { icon: 'dash', word: 'Not run' },
};

const CHECK: Record<CheckState, { icon: IconName; word: string }> = {
  passed: { icon: 'check', word: 'Passed' },
  failed: { icon: 'cross', word: 'Failed' },
  off: { icon: 'dash', word: 'Off' },
  'not-evaluated': { icon: 'circle', word: 'Not evaluated' },
};

/** "✓ Passed", "✕ Failed · 3 attempts", "– Not run". */
@Component({
  selector: 'span[mkStepStatus]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'step-status', '[attr.data-status]': 'status()' },
  template: `<svg mkIcon [name]="entry().icon" [size]="14"></svg><span>{{ entry().word }}</span>@if (showAttempts()) {<span class="step-status-attempts">· {{ attempts() }} {{ attempts() === 1 ? 'attempt' : 'attempts' }}</span>}`,
})
export class StepStatusComponent {
  readonly status = input.required<StepOutcome>();
  readonly attempts = input<number>();

  protected entry() {
    return STEP[this.status()];
  }
  protected showAttempts(): boolean {
    const a = this.attempts();
    return a !== undefined && a > 0 && (a > 1 || this.status() === 'failed');
  }
}

/** The two checks of a step, written separately: a 200 that breaks the schema still fails the step. */
@Component({
  selector: 'ul[mkStepChecks]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'checks' },
  template: `
    <li [attr.data-state]="successCriteria()">
      <span>Success criteria</span><span class="sr-only">:</span>&ngsp;<span class="checks-state"><svg mkIcon [name]="check(successCriteria()).icon" [size]="14"></svg>{{ check(successCriteria()).word }}</span>
    </li>
    @if (schemaValidation(); as schema) {
      <li [attr.data-state]="schema">
        <span>Schema validation</span><span class="sr-only">:</span>&ngsp;<span class="checks-state"><svg mkIcon [name]="check(schema).icon" [size]="14"></svg>{{ check(schema).word }}</span>
      </li>
    }
  `,
})
export class StepChecksComponent {
  readonly successCriteria = input.required<CheckState>();
  /** Omit when the run does not validate schemas. */
  readonly schemaValidation = input<CheckState>();

  protected check(state: CheckState) {
    return CHECK[state];
  }
}
