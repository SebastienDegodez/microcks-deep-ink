import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface SegmentedOption {
  id: string;
  label: string;
  /** Result count, read as "Failed, 2". */
  count?: number;
}

/**
 * Filter buttons that behave like one choice (All / Passed / Failed). A `role="group"` of
 * buttons with `aria-pressed`. Announce the result count of the filtered list in a live region.
 */
@Component({
  selector: 'mk-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'di-segmented', role: 'group', '[attr.aria-label]': 'label()' },
  template: `@for (o of options(); track o.id) {<button type="button" [attr.aria-pressed]="o.id === value()" (click)="value.set(o.id)">{{ o.label }}@if (o.count !== undefined) {<span class="di-segmented-count"><span class="di-sr-only">, </span>{{ o.count }}</span>}</button>}`,
})
export class SegmentedComponent {
  /** Accessible name of the group ("Result"). */
  readonly label = input.required<string>();
  readonly options = input.required<SegmentedOption[]>();
  /** Id of the pressed option. */
  readonly value = model.required<string>();
}
