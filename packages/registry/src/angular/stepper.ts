import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface StepperStep {
  label: string;
  /** `progress` only. Default `upcoming`. */
  state?: 'done' | 'current' | 'upcoming';
  /** Shown number; defaults to the position (1, 2, 3). */
  n?: string | number;
}

/**
 * Numbered steps in an `<ol>`: `<ol mkStepper label="Progress" [steps]="steps"></ol>`.
 * The current step has `aria-current="step"`.
 */
@Component({
  selector: 'ol[mkStepper]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stepper',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.data-variant]': 'variant()',
    '[attr.data-direction]': "direction() === 'vertical' ? 'vertical' : null",
    '[attr.data-marker]': "variant() === 'list' && marker() === 'circle' ? 'circle' : null",
  },
  template: `@for (s of steps(); track $index; let i = $index) {
    @if (variant() === 'list') {
      <li><span class="stepper-n" aria-hidden="true">{{ s.n ?? i + 1 }}{{ marker() === 'circle' ? '' : '.' }}</span><span>{{ s.label }}</span></li>
    } @else {
      <li [attr.data-state]="s.state === 'done' ? 'done' : null" [attr.aria-current]="s.state === 'current' ? 'step' : null"><span class="stepper-dot">{{ s.n ?? i + 1 }}</span>{{ s.label }}@if (s.state === 'done') {<span class="sr-only">, {{ doneLabel() }}</span>}</li>
    }
  }`,
})
export class StepperComponent {
  /** Accessible name of the list ("Progress", "Before you paste"). Optional: leave it out when the heading above names the list. */
  readonly label = input<string>();
  readonly steps = input.required<StepperStep[]>();
  /** `progress` (default): numbered dots. `list`: numbered instructions. */
  readonly variant = input<'progress' | 'list'>('progress');
  /** `progress` only: stack the steps. */
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
  /** Hidden word read after a done step. */
  readonly doneLabel = input('done');
  /** `list` only. `number` (default): a mono "1.". `circle`: the number in a 22px ring (--stepper-marker, default --proto-rest), 10px gap, 6px rows, the text stacked in a column in the inherited font (WorkflowRun plan). */
  readonly marker = input<'number' | 'circle'>('number');
}
