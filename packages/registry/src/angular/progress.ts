import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

let nextId = 0;

/** Native `<progress>` with a visible label and a written value (never color alone). Omit `value` for indeterminate. */
@Component({
  selector: 'mk-progress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="di-progress-field">
      <div class="di-progress-head">
        <label class="di-progress-label" [attr.for]="fieldId">{{ label() }}</label>
        <span class="di-progress-value">{{ percent() === undefined ? 'In progress' : percent() + '%' }}</span>
      </div>
      <progress class="di-progress" [id]="fieldId" [attr.value]="value() ?? null" [attr.max]="max()"></progress>
    </div>
  `,
})
export class ProgressComponent {
  /** Visible label. */
  readonly label = input.required<string>();
  /** Omit for an indeterminate progress. */
  readonly value = input<number>();
  readonly max = input(100);

  protected readonly fieldId = `mk-progress-${++nextId}`;
  protected readonly percent = computed(() => {
    const v = this.value();
    return v === undefined ? undefined : Math.round((v / this.max()) * 100);
  });
}

/** Native `<meter>`. The value is always written next to the bar. */
@Component({
  selector: 'mk-meter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [':host { display: contents; }'],
  template: `
    <div class="di-progress-field">
      <div class="di-progress-head">
        <label class="di-progress-label" [attr.for]="fieldId">{{ label() }}</label>
        <span class="di-progress-value">{{ valueText() ?? value() + ' / ' + max() }}</span>
      </div>
      <meter class="di-meter" [id]="fieldId" [attr.value]="value()" [attr.min]="min()" [attr.max]="max()" [attr.low]="low() ?? null" [attr.high]="high() ?? null" [attr.optimum]="optimum() ?? max()"></meter>
    </div>
  `,
})
export class MeterComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input.required<number>();
  readonly low = input<number>();
  readonly high = input<number>();
  readonly optimum = input<number>();
  /** Written value, e.g. "11 of 12". Defaults to value / max. */
  readonly valueText = input<string>();

  protected readonly fieldId = `mk-meter-${++nextId}`;
}
